ALTER TABLE "credit_cards" ADD COLUMN IF NOT EXISTS "account_id" uuid;
DO $$ BEGIN
  ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

INSERT INTO "accounts" ("user_id", "name", "type", "currency", "initial_balance", "is_active")
SELECT "user_id", "card_name" || ' · Credit Card', 'credit_card', 'INR', '0', true
FROM "credit_cards"
WHERE "account_id" IS NULL;

UPDATE "credit_cards" AS cards
SET "account_id" = accounts."id"
FROM "accounts"
WHERE cards."account_id" IS NULL
  AND accounts."user_id" = cards."user_id"
  AND accounts."name" = cards."card_name" || ' · Credit Card'
  AND accounts."type" = 'credit_card';
