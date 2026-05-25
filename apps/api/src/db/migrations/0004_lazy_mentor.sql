ALTER TABLE "expense_entries" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "income_entries" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_entries_event_id_idx" ON "expense_entries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "income_entries_event_id_idx" ON "income_entries" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "chk_expense_fund_or_event_exclusive" CHECK ("expense_entries"."designated_fund_id" IS NULL OR "expense_entries"."event_id" IS NULL);--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "chk_income_fund_or_event_exclusive" CHECK ("income_entries"."designated_fund_id" IS NULL OR "income_entries"."event_id" IS NULL);