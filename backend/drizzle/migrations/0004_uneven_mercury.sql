DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'name_translations') THEN
    ALTER TABLE "accounts" ADD COLUMN "name_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'name_translations') THEN
    ALTER TABLE "budgets" ADD COLUMN "name_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'name_translations') THEN
    ALTER TABLE "categories" ADD COLUMN "name_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'name_translations') THEN
    ALTER TABLE "goals" ADD COLUMN "name_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'notes_translations') THEN
    ALTER TABLE "goals" ADD COLUMN "notes_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rules' AND column_name = 'name_translations') THEN
    ALTER TABLE "rules" ADD COLUMN "name_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_agents' AND column_name = 'name_translations') THEN
    ALTER TABLE "trading_agents" ADD COLUMN "name_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'description_translations') THEN
    ALTER TABLE "transactions" ADD COLUMN "description_translations" jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'notes_translations') THEN
    ALTER TABLE "transactions" ADD COLUMN "notes_translations" jsonb;
  END IF;
END $$;