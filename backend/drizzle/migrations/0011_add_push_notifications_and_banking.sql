-- Add push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'ios', 'android', 'web'
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;

-- Add notification preferences to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "budgetAlerts": true,
    "priceAlerts": true,
    "recurringReminders": true,
    "weeklyReport": true,
    "marketUpdates": false
}'::jsonb;

-- Add notifications log table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'budget_warning', 'price_alert', 'recurring_reminder', 'weekly_report'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- Add bank connections table (PSD2/Open Banking)
CREATE TABLE IF NOT EXISTS bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'gocardless', -- 'gocardless', 'plaid', etc.
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    institution_logo TEXT,
    requisition_id TEXT, -- GoCardless requisition ID
    agreement_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'linked', 'expired', 'error'
    last_sync TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);

-- Add linked bank accounts table
CREATE TABLE IF NOT EXISTS linked_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
    finflow_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- Link to FinFlow account
    external_account_id TEXT NOT NULL, -- Bank's account ID
    iban TEXT,
    account_name TEXT,
    account_type TEXT, -- 'checking', 'savings', 'credit_card'
    currency TEXT NOT NULL DEFAULT 'EUR',
    balance_cents BIGINT,
    balance_updated_at TIMESTAMP WITH TIME ZONE,
    auto_sync BOOLEAN NOT NULL DEFAULT true,
    last_transaction_id TEXT, -- For incremental sync
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linked_bank_accounts_user_id ON linked_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_linked_bank_accounts_connection_id ON linked_bank_accounts(connection_id);

COMMENT ON TABLE push_tokens IS 'Push notification tokens for mobile devices';
COMMENT ON TABLE notifications IS 'Notification history and inbox';
COMMENT ON TABLE bank_connections IS 'PSD2/Open Banking connections via GoCardless';
COMMENT ON TABLE linked_bank_accounts IS 'Bank accounts linked via Open Banking';
