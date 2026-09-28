CREATE TYPE "public"."transaction_link_type" AS ENUM('credit_card', 'loan', 'insurance');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "linked_type" "transaction_link_type";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "linked_id" uuid;
