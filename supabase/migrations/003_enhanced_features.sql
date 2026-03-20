-- Enhanced Features Migration
-- Adds support for wishlist, market prices, and additional features

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, listing_id)
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  commodity TEXT NOT NULL,
  target_price NUMERIC(10, 2) NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP WITH TIME ZONE
);

-- Market prices (historical data)
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commodity TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  market_location TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'manual'
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'sn', 'nd')),
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'ZWL')),
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_listing ON wishlists(listing_id);
CREATE INDEX idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(active) WHERE active = true;
CREATE INDEX idx_market_prices_commodity ON market_prices(commodity);
CREATE INDEX idx_market_prices_date ON market_prices(recorded_at);
CREATE INDEX idx_newsletter_status ON newsletter_subscribers(status);

-- RLS Policies for wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for price alerts
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price alerts"
  ON price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own price alerts"
  ON price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price alerts"
  ON price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own price alerts"
  ON price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Market prices are public read-only
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market prices"
  ON market_prices FOR SELECT
  TO public
  USING (true);

-- Newsletter subscribers - users can manage their own subscription
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON newsletter_subscribers FOR SELECT
  USING (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own subscription"
  ON newsletter_subscribers FOR UPDATE
  USING (auth.uid() = user_id OR email = auth.email());

-- Trigger to update user preferences timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();

-- Function to check price alerts
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS void AS $$
DECLARE
  alert_record RECORD;
  current_price NUMERIC;
BEGIN
  FOR alert_record IN 
    SELECT * FROM price_alerts WHERE active = true
  LOOP
    -- Get latest price for commodity
    SELECT price INTO current_price
    FROM market_prices
    WHERE commodity = alert_record.commodity
    ORDER BY recorded_at DESC
    LIMIT 1;
    
    IF current_price IS NOT NULL THEN
      IF (alert_record.condition = 'above' AND current_price >= alert_record.target_price) OR
         (alert_record.condition = 'below' AND current_price <= alert_record.target_price) THEN
        -- Trigger alert
        UPDATE price_alerts
        SET active = false, triggered_at = CURRENT_TIMESTAMP
        WHERE id = alert_record.id;
        
        -- Create notification
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
          alert_record.user_id,
          'price_alert',
          'Price Alert Triggered',
          format('Price for %s is now $%s', alert_record.commodity, current_price)
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
