CREATE TYPE "public"."accent_enum" AS ENUM('green', 'blue', 'purple', 'rose', 'amber', 'mono');--> statement-breakpoint
CREATE TYPE "public"."asset_type_enum" AS ENUM('stock', 'etf', 'mutual_fund', 'bond');--> statement-breakpoint
CREATE TYPE "public"."card_status_enum" AS ENUM('active', 'inactive', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."connection_status_enum" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."loan_type_enum" AS ENUM('personal', 'home', 'vehicle', 'education', 'other');--> statement-breakpoint
CREATE TYPE "public"."policy_type_enum" AS ENUM('health', 'life', 'vehicle', 'home', 'travel', 'other');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency_enum" AS ENUM('weekly', 'monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."theme_enum" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution_name" varchar(100) NOT NULL,
	"provider_token" varchar(255) NOT NULL,
	"status" "connection_status_enum" DEFAULT 'connected' NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_name" varchar(100) NOT NULL,
	"bank_issuer" varchar(100) NOT NULL,
	"card_type" varchar(50) DEFAULT 'Visa' NOT NULL,
	"last4" varchar(4) NOT NULL,
	"credit_limit" numeric(15, 2) NOT NULL,
	"current_outstanding" numeric(15, 2) DEFAULT '0' NOT NULL,
	"statement_date" varchar(2) DEFAULT '1' NOT NULL,
	"payment_due_date" varchar(2) DEFAULT '15' NOT NULL,
	"interest_rate" numeric(5, 2) DEFAULT '18.50' NOT NULL,
	"annual_fee" numeric(15, 2) DEFAULT '0' NOT NULL,
	"card_status" "card_status_enum" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(100) NOT NULL,
	"policy_number" varchar(100) NOT NULL,
	"policy_type" "policy_type_enum" DEFAULT 'health' NOT NULL,
	"coverage_amount" numeric(15, 2) NOT NULL,
	"premium" numeric(15, 2) NOT NULL,
	"premium_frequency" varchar(20) DEFAULT 'annual' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"renewal_date" timestamp with time zone NOT NULL,
	"nominee" varchar(100),
	"notes" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lender" varchar(100) NOT NULL,
	"loan_type" "loan_type_enum" DEFAULT 'personal' NOT NULL,
	"original_principal" numeric(15, 2) NOT NULL,
	"current_outstanding" numeric(15, 2) NOT NULL,
	"interest_rate" numeric(5, 2) NOT NULL,
	"emi" numeric(15, 2) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"payment_frequency" varchar(20) DEFAULT 'monthly' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net_worth_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"snapshot_date" timestamp with time zone DEFAULT now() NOT NULL,
	"total_assets" numeric(15, 2) NOT NULL,
	"total_liabilities" numeric(15, 2) NOT NULL,
	"net_worth" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_type" "asset_type_enum" DEFAULT 'stock' NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"average_cost" numeric(15, 2) NOT NULL,
	"current_price" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"title" varchar(100) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" varchar(20) DEFAULT 'expense' NOT NULL,
	"category" varchar(100) DEFAULT 'Subscriptions' NOT NULL,
	"frequency" "recurring_frequency_enum" DEFAULT 'monthly' NOT NULL,
	"next_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" "theme_enum" DEFAULT 'system' NOT NULL,
	"accent" "accent_enum" DEFAULT 'green' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net_worth_snapshots" ADD CONSTRAINT "net_worth_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;