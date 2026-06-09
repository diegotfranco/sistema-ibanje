ALTER TYPE "public"."fund_status" RENAME TO "campaign_status";--> statement-breakpoint
ALTER TABLE "designated_funds" RENAME TO "campaigns";--> statement-breakpoint
ALTER TABLE "expense_entries" RENAME COLUMN "designated_fund_id" TO "campaign_id";--> statement-breakpoint
ALTER TABLE "income_entries" RENAME COLUMN "designated_fund_id" TO "campaign_id";--> statement-breakpoint
ALTER TABLE "expense_entries" DROP CONSTRAINT "chk_expense_fund_or_event_exclusive";--> statement-breakpoint
ALTER TABLE "income_entries" DROP CONSTRAINT "chk_income_fund_or_event_exclusive";--> statement-breakpoint
ALTER TABLE "expense_entries" DROP CONSTRAINT "expense_entries_designated_fund_id_designated_funds_id_fk";
--> statement-breakpoint
ALTER TABLE "income_entries" DROP CONSTRAINT "income_entries_designated_fund_id_designated_funds_id_fk";
--> statement-breakpoint
DROP INDEX "designated_funds_deleted_at_idx";--> statement-breakpoint
DROP INDEX "expense_entries_designated_fund_id_idx";--> statement-breakpoint
DROP INDEX "income_entries_designated_fund_id_idx";--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_deleted_at_idx" ON "campaigns" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "expense_entries_campaign_id_idx" ON "expense_entries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "income_entries_campaign_id_idx" ON "income_entries" USING btree ("campaign_id");--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "chk_expense_campaign_or_event_exclusive" CHECK ("expense_entries"."campaign_id" IS NULL OR "expense_entries"."event_id" IS NULL);--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "chk_income_campaign_or_event_exclusive" CHECK ("income_entries"."campaign_id" IS NULL OR "income_entries"."event_id" IS NULL);