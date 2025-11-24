ALTER TABLE "accounts" ADD COLUMN "name_translations" jsonb;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "name_translations" jsonb;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "name_translations" jsonb;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "name_translations" jsonb;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "notes_translations" jsonb;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN "name_translations" jsonb;--> statement-breakpoint
ALTER TABLE "trading_agents" ADD COLUMN "name_translations" jsonb;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "description_translations" jsonb;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "notes_translations" jsonb;