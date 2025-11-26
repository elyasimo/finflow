CREATE TABLE IF NOT EXISTS "encrypted_api_keys" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
		"user_id" uuid NOT NULL,
		"provider" text NOT NULL,
		"api_key_encrypted" text NOT NULL,
		"api_key_iv" text NOT NULL,
		"api_key_tag" text NOT NULL,
		"api_secret_encrypted" text NOT NULL,
		"api_secret_iv" text NOT NULL,
		"api_secret_tag" text NOT NULL,
		"permissions" jsonb,
		"last_used_at" timestamp with time zone,
		"created_at" timestamp with time zone DEFAULT now() NOT NULL,
		"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "price_alerts" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	"asset" VARCHAR(20) NOT NULL,
	"alert_type" VARCHAR(20) NOT NULL CHECK (alert_type IN ('above', 'below')),
	"target_price" NUMERIC(28,10) NOT NULL,
	"current_price" NUMERIC(28,10),
	"is_active" BOOLEAN DEFAULT true,
	"triggered_at" TIMESTAMP,
	"notification_sent" BOOLEAN DEFAULT false,
	"created_at" TIMESTAMP DEFAULT NOW(),
	"updated_at" TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
 ALTER TABLE "encrypted_api_keys" ADD CONSTRAINT "encrypted_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
