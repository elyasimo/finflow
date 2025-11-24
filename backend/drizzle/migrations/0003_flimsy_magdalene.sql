CREATE TABLE IF NOT EXISTS "trading_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"assets" text[] NOT NULL,
	"strategy" text DEFAULT 'conservative' NOT NULL,
	"stop_loss_percent" numeric(5, 2) DEFAULT '8.0' NOT NULL,
	"take_profit_percent" numeric(5, 2) DEFAULT '15.0' NOT NULL,
	"trailing_stop_percent" numeric(5, 2),
	"max_daily_trades_cents" bigint DEFAULT 10000 NOT NULL,
	"max_single_trade_cents" bigint DEFAULT 5000 NOT NULL,
	"entry_prices" jsonb,
	"total_trades_executed" integer DEFAULT 0 NOT NULL,
	"total_profit_cents" bigint DEFAULT 0 NOT NULL,
	"last_trade_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trading_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"action" text NOT NULL,
	"asset" text NOT NULL,
	"quantity" numeric(28, 10),
	"price_at_action" numeric(28, 10),
	"total_value_cents" bigint,
	"reason" text NOT NULL,
	"order_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trading_agents" ADD CONSTRAINT "trading_agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trading_logs" ADD CONSTRAINT "trading_logs_agent_id_trading_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."trading_agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
