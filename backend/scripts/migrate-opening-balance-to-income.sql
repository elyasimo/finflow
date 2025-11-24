-- Migration: Create Income Transactions for Existing Account Opening Balances
-- This script creates income transactions for all accounts that have an opening balance
-- but no corresponding income transaction.

-- Step 1: Preview what will be created (dry-run)
SELECT 
  a.id as account_id,
  a.name as account_name,
  a.opening_balance_cents / 100.0 as opening_balance,
  a.currency,
  a.user_id,
  a.created_at,
  COUNT(t.id) as existing_opening_balance_transactions
FROM accounts a
LEFT JOIN transactions t ON 
  t.account_id = a.id 
  AND t.description LIKE '%Opening balance%'
WHERE a.opening_balance_cents > 0
GROUP BY a.id, a.name, a.opening_balance_cents, a.currency, a.user_id, a.created_at
HAVING COUNT(t.id) = 0
ORDER BY a.created_at;

-- Step 2: Create missing opening balance transactions
-- Uncomment the following INSERT statement to execute the migration:

/*
INSERT INTO transactions (
  user_id,
  account_id,
  type,
  amount_cents,
  currency,
  date,
  description,
  category_id,
  notes,
  attachment_refs,
  tags
)
SELECT 
  a.user_id,
  a.id as account_id,
  'income' as type,
  a.opening_balance_cents as amount_cents,
  a.currency,
  a.created_at as date,  -- Use account creation date
  CONCAT('Opening balance for ', a.name) as description,
  NULL as category_id,
  'Automatically created from account opening balance (migration)' as notes,
  '[]'::jsonb as attachment_refs,
  '[]'::jsonb as tags
FROM accounts a
LEFT JOIN transactions t ON 
  t.account_id = a.id 
  AND t.description LIKE '%Opening balance%'
WHERE a.opening_balance_cents > 0
GROUP BY a.id, a.name, a.opening_balance_cents, a.currency, a.user_id, a.created_at
HAVING COUNT(t.id) = 0;
*/

-- Step 3: Verify the migration
-- Uncomment to check results after migration:

/*
SELECT 
  a.name,
  a.opening_balance_cents / 100.0 as opening_balance,
  t.description,
  t.amount_cents / 100.0 as transaction_amount,
  t.type,
  t.date
FROM accounts a
INNER JOIN transactions t ON t.account_id = a.id
WHERE t.description LIKE '%Opening balance%'
ORDER BY a.created_at;
*/
