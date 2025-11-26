DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE "budgets" ADD COLUMN "start_date" timestamp with time zone;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE "budgets" ADD COLUMN "end_date" timestamp with time zone;
  END IF;
END $$;