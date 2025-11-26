DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'name'
  ) THEN
    ALTER TABLE "budgets" ADD COLUMN "name" text;
  END IF;
END $$;