CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"notes" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "board_meetings_meeting_date_idx" ON "board_meetings" USING btree ("meeting_date");--> statement-breakpoint
CREATE INDEX "board_meetings_status_idx" ON "board_meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expense_entries_reference_date_idx" ON "expense_entries" USING btree ("reference_date");--> statement-breakpoint
CREATE INDEX "expense_entries_status_idx" ON "expense_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expense_entries_category_id_idx" ON "expense_entries" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expense_entries_member_id_idx" ON "expense_entries" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "expense_entries_payment_method_id_idx" ON "expense_entries" USING btree ("payment_method_id");--> statement-breakpoint
CREATE INDEX "expense_entries_designated_fund_id_idx" ON "expense_entries" USING btree ("designated_fund_id");--> statement-breakpoint
CREATE INDEX "expense_entries_parent_id_idx" ON "expense_entries" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "income_entries_reference_date_idx" ON "income_entries" USING btree ("reference_date");--> statement-breakpoint
CREATE INDEX "income_entries_status_idx" ON "income_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "income_entries_category_id_idx" ON "income_entries" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "income_entries_member_id_idx" ON "income_entries" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "income_entries_payment_method_id_idx" ON "income_entries" USING btree ("payment_method_id");--> statement-breakpoint
CREATE INDEX "income_entries_designated_fund_id_idx" ON "income_entries" USING btree ("designated_fund_id");--> statement-breakpoint
CREATE INDEX "members_status_idx" ON "members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "minute_versions_minute_id_idx" ON "minute_versions" USING btree ("minute_id");--> statement-breakpoint
CREATE INDEX "monthly_closings_status_idx" ON "monthly_closings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");