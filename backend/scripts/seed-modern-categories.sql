-- Modern Categories with Icons for Financial Manager
-- This script creates new categories with modern 3D-style icons

-- Get the user_id (you need to replace this with actual user_id)
-- For now, we'll use a placeholder that needs to be replaced

-- Income Categories (Einnahmen)
INSERT INTO categories (user_id, name, icon, color, name_translations) VALUES
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18', -- Replace with actual user_id
  'Gehalt',
  'salary',
  '#11998E',
  '{"en": "Salary", "de": "Gehalt", "fr": "Salaire", "ar": "راتب"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Investitionen',
  'investment',
  '#ED4264',
  '{"en": "Investment Returns", "de": "Investitionen", "fr": "Investissements", "ar": "استثمارات"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Geschenke',
  'other',
  '#A8EDEA',
  '{"en": "Gifts Received", "de": "Geschenke", "fr": "Cadeaux", "ar": "هدايا"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Sonstige Einnahmen',
  'other',
  '#FED6E3',
  '{"en": "Other Income", "de": "Sonstige Einnahmen", "fr": "Autres revenus", "ar": "دخل آخر"}'
);

-- Expense Categories (Ausgaben)
INSERT INTO categories (user_id, name, icon, color, name_translations) VALUES
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Essen & Trinken',
  'food',
  '#FF6B6B',
  '{"en": "Food & Drinks", "de": "Essen & Trinken", "fr": "Nourriture & Boissons", "ar": "طعام وشراب"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Transport',
  'transport',
  '#4E54C8',
  '{"en": "Transport", "de": "Transport", "fr": "Transport", "ar": "نقل"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Einkaufen',
  'shopping',
  '#F093FB',
  '{"en": "Shopping", "de": "Einkaufen", "fr": "Shopping", "ar": "تسوق"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Unterhaltung',
  'entertainment',
  '#FA709A',
  '{"en": "Entertainment", "de": "Unterhaltung", "fr": "Divertissement", "ar": "ترفيه"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Gesundheit',
  'health',
  '#43E97B',
  '{"en": "Health", "de": "Gesundheit", "fr": "Santé", "ar": "صحة"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Bildung',
  'education',
  '#667EEA',
  '{"en": "Education", "de": "Bildung", "fr": "Éducation", "ar": "تعليم"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Wohnung',
  'home',
  '#FFA751',
  '{"en": "Housing", "de": "Wohnung", "fr": "Logement", "ar": "سكن"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Nebenkosten',
  'utilities',
  '#30CFD0',
  '{"en": "Utilities", "de": "Nebenkosten", "fr": "Services publics", "ar": "مرافق"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Reisen',
  'travel',
  '#00C9FF',
  '{"en": "Travel", "de": "Reisen", "fr": "Voyage", "ar": "سفر"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Versicherung',
  'other',
  '#A8EDEA',
  '{"en": "Insurance", "de": "Versicherung", "fr": "Assurance", "ar": "تأمين"}'
),
(
  'd5ff4e15-1c8d-4895-a029-bb137b75bc18',
  'Sonstiges',
  'other',
  '#FED6E3',
  '{"en": "Other", "de": "Sonstiges", "fr": "Autre", "ar": "آخر"}'
);

-- Verify the insertion
SELECT name, icon, color FROM categories ORDER BY name;
