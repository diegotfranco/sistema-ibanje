CREATE TABLE "finance_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_finance_settings_singleton" CHECK ("finance_settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "treasury_closings" RENAME TO "monthly_closings";--> statement-breakpoint
ALTER TABLE "monthly_closings" RENAME COLUMN "available_balance" TO "closing_balance";--> statement-breakpoint
ALTER TABLE "monthly_closings" DROP CONSTRAINT "uq_treasury_closing_period";--> statement-breakpoint
ALTER TABLE "monthly_closings" DROP CONSTRAINT "chk_period_month_valid";--> statement-breakpoint
ALTER TABLE "monthly_closings" DROP CONSTRAINT "treasury_closings_submitted_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "monthly_closings" DROP CONSTRAINT "treasury_closings_closed_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "expense_entries" ADD COLUMN "designated_fund_id" integer;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_designated_fund_id_designated_funds_id_fk" FOREIGN KEY ("designated_fund_id") REFERENCES "public"."designated_funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "uq_monthly_closing_period" UNIQUE("period_year","period_month");--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "chk_period_month_valid" CHECK ("monthly_closings"."period_month" BETWEEN 1 AND 12);