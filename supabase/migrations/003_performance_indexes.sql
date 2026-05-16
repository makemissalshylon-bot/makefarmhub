/**
 * Performance Indexes Migration
 * Adds indexes to frequently queried columns for faster queries
 */

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_available ON listings(available);

-- Composite index for common marketplace queries
CREATE INDEX IF NOT EXISTS idx_listings_category_status_available 
ON listings(category, status, available) 
WHERE status = 'active';

-- Full-text search index for listings
CREATE INDEX IF NOT EXISTS idx_listings_search 
ON listings USING gin(to_tsvector('english', title || ' ' || description));

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);

-- Composite index for order queries by user role
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, status);

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON wallet_transactions(order_id) WHERE order_id IS NOT NULL;

-- Composite index for transaction history queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_status 
ON wallet_transactions(user_id, status, created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Composite index for conversation messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2_id ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Composite index for finding user conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
ON conversations(participant1_id, participant2_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Composite index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, read, created_at DESC) 
WHERE read = false;

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_target_id ON reviews(target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target_type ON reviews(target_type);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Composite index for product/seller reviews
CREATE INDEX IF NOT EXISTS idx_reviews_target 
ON reviews(target_id, target_type, created_at DESC);

-- Transport requests indexes
CREATE INDEX IF NOT EXISTS idx_transport_requests_order_id ON transport_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_transporter_id ON transport_requests(transporter_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_status ON transport_requests(status);
CREATE INDEX IF NOT EXISTS idx_transport_requests_created_at ON transport_requests(created_at DESC);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(available);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Composite index for active disputes
CREATE INDEX IF NOT EXISTS idx_disputes_status_created 
ON disputes(status, created_at DESC) 
WHERE status IN ('open', 'investigating');

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_listings_active 
ON listings(created_at DESC) 
WHERE status = 'active' AND available = true;

CREATE INDEX IF NOT EXISTS idx_orders_pending 
ON orders(created_at DESC) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_active 
ON orders(created_at DESC) 
WHERE status IN ('confirmed', 'in_transit', 'delivered');

-- Analyze tables to update query planner statistics
ANALYZE profiles;
ANALYZE listings;
ANALYZE orders;
ANALYZE wallet_transactions;
ANALYZE messages;
ANALYZE conversations;
ANALYZE notifications;
ANALYZE reviews;
ANALYZE transport_requests;
ANALYZE vehicles;
ANALYZE disputes;

-- Add comments for documentation
COMMENT ON INDEX idx_listings_category_status_available IS 'Optimizes marketplace filtering queries';
COMMENT ON INDEX idx_listings_search IS 'Enables full-text search on listings';
COMMENT ON INDEX idx_notifications_user_unread IS 'Optimizes unread notification queries';
COMMENT ON INDEX idx_listings_active IS 'Partial index for active listings only';
