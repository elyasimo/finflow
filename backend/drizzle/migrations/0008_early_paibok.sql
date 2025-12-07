CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budgets_user_id_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budgets_category_id_idx" ON "budgets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holdings_user_id_idx" ON "holdings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holdings_symbol_idx" ON "holdings" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prices_symbol_currency_idx" ON "prices" USING btree ("symbol","currency");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions" USING btree ("type");