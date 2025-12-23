-- Migration: Remove Banking Integration Tables
-- Date: 2025-12-24
-- Description: Remove bank_connections and linked_bank_accounts tables as banking feature is being removed

-- Drop linked_bank_accounts table first (has foreign key to bank_connections)
DROP TABLE IF EXISTS linked_bank_accounts;

-- Drop bank_connections table
DROP TABLE IF EXISTS bank_connections;

-- Note: This migration is irreversible. Banking data will be permanently deleted.
-- Make sure to backup data if needed before running this migration.
