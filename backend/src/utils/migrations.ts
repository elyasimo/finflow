import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');

  try {
    // Create price_alerts table if not exists
    await db.execute(sql`
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
      )
    `);

    // Create indexes if not exists
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_price_alerts_user_active 
      ON price_alerts(user_id, is_active)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_price_alerts_asset 
      ON price_alerts(asset, is_active)
    `);

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't crash the app, just log the error
    console.log('⚠️  Continuing with startup...');
  }
}
