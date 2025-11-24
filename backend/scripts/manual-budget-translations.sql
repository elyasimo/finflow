-- Manual translations for existing budgets
-- Run this with: docker-compose exec postgres psql -U finflow -d finflow -f /path/to/this/file.sql

-- Update "Monatliche Augaben November"
UPDATE budgets
SET name_translations = '{
  "de": "Monatliche Ausgaben November",
  "en": "Monthly Expenses November",
  "fr": "Dépenses mensuelles novembre",
  "ar": "المصروفات الشهرية نوفمبر"
}'::jsonb
WHERE name LIKE '%Augaben November%' OR name = 'Monatliche Augaben November';

-- Update "Monatliche Augaben Dezember"
UPDATE budgets
SET name_translations = '{
  "de": "Monatliche Ausgaben Dezember",
  "en": "Monthly Expenses December",
  "fr": "Dépenses mensuelles décembre",
  "ar": "المصروفات الشهرية ديسمبر"
}'::jsonb
WHERE name LIKE '%Augaben Dezember%' OR name = 'Monatliche Augaben Dezember';

-- Update "Quartal AXA KFZ"
UPDATE budgets
SET name_translations = '{
  "de": "Quartal AXA KFZ",
  "en": "Quarterly AXA Car Insurance",
  "fr": "Assurance auto AXA trimestrielle",
  "ar": "التأمين الفصلي على السيارة AXA"
}'::jsonb
WHERE name LIKE '%Quartal AXA%';

-- Update "Monthly Budget" (if exists)
UPDATE budgets
SET name_translations = '{
  "de": "Monatliches Budget",
  "en": "Monthly Budget",
  "fr": "Budget mensuel",
  "ar": "الميزانية الشهرية"
}'::jsonb
WHERE name = 'Monthly Budget';

-- Show updated budgets
SELECT id, name, name_translations FROM budgets;
