-- Add table for storing encrypted API keys
CREATE TABLE IF NOT EXISTS "encrypted_api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL, -- 'binance', 'alpaca', etc.
  "api_key_encrypted" text NOT NULL,
  "api_key_iv" text NOT NULL,
  "api_key_tag" text NOT NULL,
  "api_secret_encrypted" text NOT NULL,
  "api_secret_iv" text NOT NULL,
  "api_secret_tag" text NOT NULL,
  "permissions" jsonb, -- Optional: store what permissions this key has
  "last_used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for faster lookups by user and provider
CREATE INDEX IF NOT EXISTS "encrypted_api_keys_user_provider_idx" ON "encrypted_api_keys"("user_id", "provider");
