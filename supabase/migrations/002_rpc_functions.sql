-- MakeFarmHub RPC Functions
-- Admin statistics and complex query functions

-- ============================================
-- ADMIN STATISTICS FUNCTIONS
-- ============================================

-- Get comprehensive admin statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_farmers', (SELECT COUNT(*) FROM profiles WHERE role = 'farmer'),
    'total_buyers', (SELECT COUNT(*) FROM profiles WHERE role = 'buyer'),
    'total_transporters', (SELECT COUNT(*) FROM profiles WHERE role = 'transporter'),
    'verified_users', (SELECT COUNT(*) FROM profiles WHERE verified = true),
    'total_listings', (SELECT COUNT(*) FROM listings),
    'active_listings', (SELECT COUNT(*) FROM listings WHERE status = 'active'),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'completed_orders', (SELECT COUNT(*) FROM orders WHERE status = 'delivered'),
    'total_revenue', (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'delivered'),
    'escrow_balance', (SELECT COALESCE(SUM(escrow_held), 0) FROM wallets),
    'total_disputes', (SELECT COUNT(*) FROM disputes),
    'open_disputes', (SELECT COUNT(*) FROM disputes WHERE status = 'open'),
    'total_messages', (SELECT COUNT(*) FROM messages),
    'unread_messages', (SELECT COUNT(*) FROM messages WHERE read = false)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get revenue analytics by period
CREATE OR REPLACE FUNCTION get_revenue_analytics(days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  revenue DECIMAL(10,2),
  orders_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COALESCE(SUM(total_price), 0) as revenue,
    COUNT(*) as orders_count
  FROM orders
  WHERE status = 'delivered' 
    AND created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get top selling products
CREATE OR REPLACE FUNCTION get_top_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  category TEXT,
  total_sold BIGINT,
  total_revenue DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as listing_id,
    l.title,
    l.category,
    COUNT(o.id) as total_sold,
    COALESCE(SUM(o.total_price), 0) as total_revenue
  FROM listings l
  LEFT JOIN orders o ON o.listing_id = l.id AND o.status = 'delivered'
  GROUP BY l.id, l.title, l.category
  ORDER BY total_sold DESC, total_revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user growth analytics
CREATE OR REPLACE FUNCTION get_user_growth(days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  new_users BIGINT,
  farmers BIGINT,
  buyers BIGINT,
  transporters BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users,
    COUNT(*) FILTER (WHERE role = 'farmer') as farmers,
    COUNT(*) FILTER (WHERE role = 'buyer') as buyers,
    COUNT(*) FILTER (WHERE role = 'transporter') as transporters
  FROM profiles
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WALLET FUNCTIONS
-- ============================================

-- Transfer funds between wallets (internal transfer)
CREATE OR REPLACE FUNCTION transfer_funds(
  from_user_id UUID,
  to_user_id UUID,
  amount DECIMAL(10,2),
  description TEXT DEFAULT 'Transfer'
)
RETURNS JSON AS $$
DECLARE
  from_wallet RECORD;
  result JSON;
BEGIN
  -- Check sender balance
  SELECT * INTO from_wallet FROM wallets WHERE user_id = from_user_id;
  
  IF from_wallet.balance < amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct from sender
  UPDATE wallets 
  SET balance = balance - amount
  WHERE user_id = from_user_id;

  -- Add to recipient
  UPDATE wallets 
  SET balance = balance + amount
  WHERE user_id = to_user_id;

  -- Record transactions
  INSERT INTO wallet_transactions (user_id, type, amount, status, description)
  VALUES 
    (from_user_id, 'withdrawal', amount, 'completed', description),
    (to_user_id, 'deposit', amount, 'completed', description);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process escrow for order
CREATE OR REPLACE FUNCTION process_order_escrow(
  order_id_param UUID,
  buyer_id_param UUID,
  amount_param DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
  buyer_wallet RECORD;
BEGIN
  -- Check buyer balance
  SELECT * INTO buyer_wallet FROM wallets WHERE user_id = buyer_id_param;
  
  IF buyer_wallet.balance < amount_param THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Hold funds in escrow
  UPDATE wallets 
  SET 
    balance = balance - amount_param,
    escrow_held = escrow_held + amount_param
  WHERE user_id = buyer_id_param;

  -- Record transaction
  INSERT INTO wallet_transactions (user_id, type, amount, status, description, reference)
  VALUES (buyer_id_param, 'escrow_hold', amount_param, 'completed', 'Escrow hold for order', order_id_param::TEXT);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release escrow to seller
CREATE OR REPLACE FUNCTION release_order_escrow(
  order_id_param UUID,
  buyer_id_param UUID,
  seller_id_param UUID,
  amount_param DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
  commission DECIMAL(10,2);
  seller_amount DECIMAL(10,2);
BEGIN
  commission := amount_param * 0.05; -- 5% platform fee
  seller_amount := amount_param - commission;

  -- Release buyer escrow
  UPDATE wallets 
  SET escrow_held = escrow_held - amount_param
  WHERE user_id = buyer_id_param;

  -- Credit seller
  UPDATE wallets 
  SET balance = balance + seller_amount
  WHERE user_id = seller_id_param;

  -- Record transactions
  INSERT INTO wallet_transactions (user_id, type, amount, fee, status, description, reference)
  VALUES 
    (buyer_id_param, 'escrow_release', amount_param, 0, 'completed', 'Escrow released for order', order_id_param::TEXT),
    (seller_id_param, 'payment', seller_amount, commission, 'completed', 'Payment received for order', order_id_param::TEXT);

  RETURN json_build_object('success', true, 'seller_amount', seller_amount, 'commission', commission);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEARCH AND FILTER FUNCTIONS
-- ============================================

-- Advanced listing search
CREATE OR REPLACE FUNCTION search_listings(
  search_query TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  seller_name TEXT,
  seller_rating DECIMAL,
  title TEXT,
  description TEXT,
  category TEXT,
  price DECIMAL,
  unit TEXT,
  quantity DECIMAL,
  location TEXT,
  images TEXT[],
  status TEXT,
  views INTEGER,
  featured BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.seller_id,
    p.name as seller_name,
    p.rating as seller_rating,
    l.title,
    l.description,
    l.category,
    l.price,
    l.unit,
    l.quantity,
    l.location,
    l.images,
    l.status,
    l.views,
    l.featured,
    l.created_at
  FROM listings l
  JOIN profiles p ON p.id = l.seller_id
  WHERE l.status = 'active'
    AND (search_query IS NULL OR 
         l.title ILIKE '%' || search_query || '%' OR 
         l.description ILIKE '%' || search_query || '%')
    AND (category_filter IS NULL OR l.category = category_filter)
    AND (min_price IS NULL OR l.price >= min_price)
    AND (max_price IS NULL OR l.price <= max_price)
    AND (location_filter IS NULL OR l.location ILIKE '%' || location_filter || '%')
  ORDER BY l.featured DESC, l.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTIFICATION FUNCTIONS
-- ============================================

-- Create notification for user
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  type_param TEXT,
  title_param TEXT,
  message_param TEXT,
  link_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (user_id_param, type_param, title_param, message_param, link_param, metadata_param)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = user_id_param AND read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REVIEW FUNCTIONS
-- ============================================

-- Get average rating for user
CREATE OR REPLACE FUNCTION get_user_rating(user_id_param UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE reviewee_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_growth(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_funds(UUID, UUID, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_order_escrow(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION release_order_escrow(UUID, UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION search_listings(TEXT, TEXT, DECIMAL, DECIMAL, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rating(UUID) TO authenticated;
