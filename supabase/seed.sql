-- MakeFarmHub Seed Data
-- Initial data for development and testing

-- Sample Profiles (passwords should be set via Supabase Auth)
INSERT INTO profiles (id, name, email, phone, role, location, verified, bio, rating, total_reviews)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@makefarmhub.com', '+263771234567', 'admin', 'Harare', true, 'Platform Administrator', 5.0, 0),
  ('00000000-0000-0000-0000-000000000002', 'John Farmer', 'john@example.com', '+263771234568', 'farmer', 'Masvingo', true, 'Experienced maize and tobacco farmer', 4.8, 15),
  ('00000000-0000-0000-0000-000000000003', 'Sarah Buyer', 'sarah@example.com', '+263771234569', 'buyer', 'Harare', true, 'Wholesale buyer for supermarket chain', 4.5, 8),
  ('00000000-0000-0000-0000-000000000004', 'Mike Transport', 'mike@example.com', '+263771234570', 'transporter', 'Bulawayo', true, 'Reliable transport services across Zimbabwe', 4.9, 22)
ON CONFLICT (id) DO NOTHING;

-- Sample Listings
INSERT INTO listings (id, seller_id, title, description, category, subcategory, price, unit, quantity, location, status, featured)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000002', 'Premium White Maize', 'Grade A white maize, recently harvested. Perfect for milling or resale.', 'crops', 'grains', 250.00, 'kg', 5000, 'Masvingo', 'active', true),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000002', 'Fresh Tomatoes', 'Organic tomatoes, vine-ripened. Great for markets and restaurants.', 'crops', 'vegetables', 1.50, 'kg', 500, 'Masvingo', 'active', false),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000002', 'Tobacco Leaves', 'Cured tobacco leaves, high quality grade.', 'crops', 'tobacco', 8.00, 'kg', 2000, 'Masvingo', 'active', false);

-- Sample Wallets
INSERT INTO wallets (user_id, balance, escrow_held)
VALUES
  ('00000000-0000-0000-0000-000000000001', 10000.00, 0),
  ('00000000-0000-0000-0000-000000000002', 5000.00, 500.00),
  ('00000000-0000-0000-0000-000000000003', 8000.00, 1000.00),
  ('00000000-0000-0000-0000-000000000004', 3000.00, 0)
ON CONFLICT (user_id) DO NOTHING;

-- Sample Vehicles
INSERT INTO vehicles (owner_id, owner_name, type, name, capacity, price_per_km, available, location, rating, trips)
VALUES
  ('00000000-0000-0000-0000-000000000004', 'Mike Transport', 'truck', 'Isuzu FRR 5-Ton Truck', '5000 kg', 2.50, true, 'Bulawayo', 4.9, 22),
  ('00000000-0000-0000-0000-000000000004', 'Mike Transport', 'pickup', 'Toyota Hiace Van', '1500 kg', 1.80, true, 'Bulawayo', 4.9, 15)
ON CONFLICT (id) DO NOTHING;
