-- Meine Budget-Übersetzungen
-- Verwendung: docker-compose exec -T postgres psql -U finflow -d finflow < backend/scripts/my-budget-translations.sql

-- Beispiel 1: Lebensmittelbudget
UPDATE budgets
SET name_translations = '{
  "de": "Monatliches Lebensmittelbudget",
  "en": "Monthly Grocery Budget",
  "fr": "Budget mensuel pour l'épicerie",
  "ar": "ميزانية البقالة الشهرية"
}'::jsonb
WHERE name = 'Lebensmittel';

-- Beispiel 2: Transportbudget
UPDATE budgets
SET name_translations = '{
  "de": "Transportkosten",
  "en": "Transportation Budget",
  "fr": "Budget transport",
  "ar": "ميزانية النقل"
}'::jsonb
WHERE name = 'Transport';

-- Beispiel 3: Unterhaltungsbudget
UPDATE budgets
SET name_translations = '{
  "de": "Unterhaltung",
  "en": "Entertainment",
  "fr": "Divertissement",
  "ar": "الترفيه"
}'::jsonb
WHERE name = 'Unterhaltung';

-- Zeige alle aktualisierten Budgets
SELECT name, name_translations FROM budgets;
