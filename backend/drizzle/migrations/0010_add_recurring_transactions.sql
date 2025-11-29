-- Add recurring transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- income, expense, transfer
    amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL,
    description TEXT,
    description_translations JSONB,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    
    -- Recurrence settings
    frequency TEXT NOT NULL, -- daily, weekly, monthly, yearly
    interval_count INTEGER NOT NULL DEFAULT 1, -- e.g., every 2 weeks
    day_of_month INTEGER, -- for monthly: 1-31 (null = same day)
    day_of_week INTEGER, -- for weekly: 0=Sunday, 1=Monday, etc.
    
    -- Schedule
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE, -- null = no end
    next_occurrence TIMESTAMP WITH TIME ZONE NOT NULL,
    last_processed TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_post BOOLEAN NOT NULL DEFAULT true, -- auto create transaction or just remind
    reminder_days INTEGER DEFAULT 3, -- remind X days before
    
    -- Stats
    total_occurrences INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions(next_occurrence) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_account_id ON recurring_transactions(account_id);

-- Add recurring_transaction_id to transactions table to track generated transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL;

COMMENT ON TABLE recurring_transactions IS 'Wiederkehrende Transaktionen (Miete, Gehalt, Abos, etc.)';
