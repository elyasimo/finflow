-- Create price_alerts table if not exists
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('above', 'below')),
  target_price NUMERIC(28,10) NOT NULL,
  current_price NUMERIC(28,10),
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_active ON price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_asset ON price_alerts(asset, is_active);
