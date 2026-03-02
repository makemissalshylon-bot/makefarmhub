-- MAKEFARMHUB Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('farmer', 'buyer', 'transporter', 'admin')),
  avatar TEXT,
  location TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  -- Auto-create wallet
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- LISTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('crops', 'livestock', 'equipment')),
  subcategory TEXT DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  quantity INTEGER DEFAULT 1,
  location TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold', 'draft')),
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  organic BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  ready_to_sell BOOLEAN DEFAULT false,
  delivery_terms TEXT,
  delivery_options TEXT[] DEFAULT '{}',
  payment_options TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id),
  listing_title TEXT NOT NULL,
  listing_image TEXT DEFAULT '',
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  buyer_name TEXT NOT NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  seller_name TEXT NOT NULL,
  transporter_id UUID REFERENCES profiles(id),
  transporter_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  escrow_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled')),
  delivery_address TEXT DEFAULT '',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  listing_id UUID REFERENCES listings(id),
  listing_title TEXT,
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewer_name TEXT NOT NULL,
  reviewer_avatar TEXT,
  reviewer_role TEXT NOT NULL,
  target_id UUID NOT NULL REFERENCES profiles(id),
  target_name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('seller', 'buyer', 'listing')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT DEFAULT '',
  comment TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  helpful INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  seller_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_target ON reviews(target_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'message', 'payment', 'system', 'success', 'warning', 'info')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================
-- WALLETS & TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) DEFAULT 0,
  pending_balance NUMERIC(12,2) DEFAULT 0,
  escrow_held NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'escrow_hold', 'escrow_release', 'payment', 'refund', 'commission')),
  amount NUMERIC(12,2) NOT NULL,
  fee NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT DEFAULT '',
  reference TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);

-- ============================================
-- VEHICLES & TRANSPORT
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pickup', 'truck', 'lorry', 'refrigerated')),
  name TEXT NOT NULL,
  capacity TEXT DEFAULT '',
  price_per_km NUMERIC(8,2) DEFAULT 0,
  available BOOLEAN DEFAULT true,
  location TEXT DEFAULT '',
  image TEXT DEFAULT '',
  rating NUMERIC(3,2) DEFAULT 0,
  trips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);

CREATE TABLE IF NOT EXISTS transport_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  distance NUMERIC(10,2) DEFAULT 0,
  estimated_price NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed')),
  vehicle_id UUID REFERENCES vehicles(id),
  scheduled_date TIMESTAMPTZ DEFAULT NOW(),
  current_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISPUTES
-- ============================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  order_title TEXT NOT NULL,
  raised_by_id UUID NOT NULL REFERENCES profiles(id),
  raised_by_name TEXT NOT NULL,
  raised_by_role TEXT NOT NULL,
  against_id UUID NOT NULL REFERENCES profiles(id),
  against_name TEXT NOT NULL,
  against_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated')),
  amount NUMERIC(12,2) DEFAULT 0,
  evidence TEXT[] DEFAULT '{}',
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles: users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings: everyone can read active, sellers manage own
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (true);
CREATE POLICY "Sellers can insert own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own listings" ON listings FOR DELETE USING (auth.uid() = seller_id);

-- Orders: participants can view their orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR auth.uid() = transporter_id);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update orders" ON orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Conversations: participants only
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE POLICY "Participants can update conversations" ON conversations FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- Messages: conversation participants
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND auth.uid() = ANY(conversations.participant_ids))
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages read" ON messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND auth.uid() = ANY(conversations.participant_ids))
);

-- Reviews: public read, authenticated write
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can write reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications: own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Wallets: own only
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage wallets" ON wallets FOR ALL USING (true);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create transactions" ON wallet_transactions FOR INSERT WITH CHECK (true);

-- Vehicles: public read, owner manage
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vehicles are viewable by everyone" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Owners can manage vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update vehicles" ON vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete vehicles" ON vehicles FOR DELETE USING (auth.uid() = owner_id);

-- Transport requests
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transport requests viewable by participants" ON transport_requests FOR SELECT USING (true);
CREATE POLICY "Users can create transport requests" ON transport_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update transport requests" ON transport_requests FOR UPDATE USING (true);

-- Disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disputes viewable by participants" ON disputes FOR SELECT USING (auth.uid() = raised_by_id OR auth.uid() = against_id);
CREATE POLICY "Users can create disputes" ON disputes FOR INSERT WITH CHECK (auth.uid() = raised_by_id);
CREATE POLICY "Admins can update disputes" ON disputes FOR UPDATE USING (true);

-- ============================================
-- REALTIME (enable for chat & notifications)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these separately in Supabase Dashboard > Storage:
-- 1. Create bucket "listing-images" (public)
-- 2. Create bucket "avatars" (public)
-- 3. Create bucket "review-images" (public)
