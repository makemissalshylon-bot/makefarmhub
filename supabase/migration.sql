-- =============================================
-- MAKEFARMHUB - Supabase Database Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('farmer', 'buyer', 'transporter', 'admin')),
  avatar TEXT,
  location TEXT DEFAULT '',
  verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. LISTINGS TABLE
-- =============================================
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
  featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  organic BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  ready_to_sell BOOLEAN DEFAULT TRUE,
  delivery_terms TEXT DEFAULT '',
  delivery_options TEXT[] DEFAULT '{}',
  payment_options TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to increment listing views
CREATE OR REPLACE FUNCTION increment_views(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE listings SET views = views + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  listing_title TEXT DEFAULT '',
  listing_image TEXT DEFAULT '',
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  buyer_name TEXT DEFAULT '',
  seller_id UUID NOT NULL REFERENCES profiles(id),
  seller_name TEXT DEFAULT '',
  transporter_id UUID REFERENCES profiles(id),
  transporter_name TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) DEFAULT 0,
  escrow_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled')),
  delivery_address TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. CONVERSATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL DEFAULT '{}',
  participant_names TEXT[] DEFAULT '{}',
  participant_avatars TEXT[] DEFAULT '{}',
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  listing_title TEXT DEFAULT '',
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  sender_name TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  type TEXT DEFAULT 'system' CHECK (type IN ('order', 'message', 'payment', 'system', 'success', 'warning', 'info')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. WALLETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) DEFAULT 0,
  pending_balance NUMERIC(12,2) DEFAULT 0,
  escrow_held NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. WALLET TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'escrow_hold', 'escrow_release', 'payment', 'refund', 'commission')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fee NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT DEFAULT '',
  reference TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. VEHICLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_name TEXT DEFAULT '',
  type TEXT DEFAULT 'truck' CHECK (type IN ('pickup', 'truck', 'lorry', 'refrigerated')),
  name TEXT NOT NULL DEFAULT '',
  capacity TEXT DEFAULT '',
  price_per_km NUMERIC(8,2) DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  location TEXT DEFAULT '',
  image TEXT DEFAULT '',
  rating NUMERIC(3,2) DEFAULT 0,
  trips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. TRANSPORT REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transport_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  pickup_location TEXT DEFAULT '',
  delivery_location TEXT DEFAULT '',
  distance NUMERIC(10,2) DEFAULT 0,
  estimated_price NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed')),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  scheduled_date TEXT DEFAULT '',
  current_location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewer_name TEXT DEFAULT '',
  reviewer_avatar TEXT DEFAULT '',
  reviewer_role TEXT DEFAULT '',
  target_id UUID NOT NULL REFERENCES profiles(id),
  target_name TEXT DEFAULT '',
  target_type TEXT NOT NULL CHECK (target_type IN ('seller', 'buyer', 'listing')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  helpful INTEGER DEFAULT 0,
  unhelpful INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  seller_response JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. DISPUTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_title TEXT DEFAULT '',
  raised_by JSONB NOT NULL DEFAULT '{}',
  against JSONB NOT NULL DEFAULT '{}',
  reason TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated')),
  amount NUMERIC(12,2) DEFAULT 0,
  evidence TEXT[] DEFAULT '{}',
  resolution TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- =============================================
-- 13. ESCROW PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS escrow_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(12,2) DEFAULT 0,
  transport_fee NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  payment_method TEXT DEFAULT '',
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_transporter_id ON orders(transporter_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(available);

CREATE INDEX IF NOT EXISTS idx_reviews_target_id ON reviews(target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- LISTINGS: Anyone can read active listings, sellers manage their own
CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (true);
CREATE POLICY "Sellers can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own listings" ON listings FOR DELETE USING (auth.uid() = seller_id);

-- ORDERS: Participants can view and manage their orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR auth.uid() = transporter_id
);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update orders" ON orders FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR auth.uid() = transporter_id
);

-- CONVERSATIONS: Participants can view their conversations
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (
  auth.uid() = ANY(participant_ids)
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (
  auth.uid() = ANY(participant_ids)
);
CREATE POLICY "Participants can update conversations" ON conversations FOR UPDATE USING (
  auth.uid() = ANY(participant_ids)
);

-- MESSAGES: Conversation participants can read/send messages
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id
    AND auth.uid() = ANY(conversations.participant_ids)
  )
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update message read status" ON messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id
    AND auth.uid() = ANY(conversations.participant_ids)
  )
);

-- NOTIFICATIONS: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- WALLETS: Users can only see their own wallet
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wallet" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- WALLET TRANSACTIONS: Users can see their own transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- VEHICLES: Anyone can view, owners manage their own
CREATE POLICY "Vehicles are viewable by everyone" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Owners can create vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = owner_id);

-- TRANSPORT REQUESTS: Viewable by related parties
CREATE POLICY "Transport requests are viewable" ON transport_requests FOR SELECT USING (true);
CREATE POLICY "Users can create transport requests" ON transport_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update transport requests" ON transport_requests FOR UPDATE USING (true);

-- REVIEWS: Anyone can read, reviewers can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id OR auth.uid() = target_id);

-- DISPUTES: Participants can view
CREATE POLICY "Users can view disputes" ON disputes FOR SELECT USING (true);
CREATE POLICY "Users can create disputes" ON disputes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update disputes" ON disputes FOR UPDATE USING (true);

-- ESCROW PAYMENTS: Participants can view
CREATE POLICY "Users can view own escrow" ON escrow_payments FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
CREATE POLICY "Users can create escrow" ON escrow_payments FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update escrow" ON escrow_payments FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- =============================================
-- REALTIME: Enable realtime for key tables
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- =============================================
-- STORAGE BUCKETS
-- Run these separately in Supabase Dashboard > Storage
-- Or use the SQL below:
-- =============================================

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Anyone can view, authenticated users can upload
CREATE POLICY "Anyone can view listing images" ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own listing images" ON storage.objects FOR UPDATE
USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own listing images" ON storage.objects FOR DELETE
USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
