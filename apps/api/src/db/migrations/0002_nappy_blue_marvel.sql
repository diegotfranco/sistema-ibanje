ALTER TABLE "attenders" ALTER COLUMN "address_number" SET DATA TYPE varchar(16) USING "address_number"::text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "created_by_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "minutes" ALTER COLUMN "opening_time" SET DATA TYPE time USING NULLIF("opening_time", '')::time;--> statement-breakpoint
ALTER TABLE "minutes" ALTER COLUMN "closing_time" SET DATA TYPE time USING NULLIF("closing_time", '')::time;--> statement-breakpoint
CREATE INDEX "expense_entries_user_id_idx" ON "expense_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "income_entries_user_id_idx" ON "income_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_start_time_idx" ON "events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_created_by_user_id_idx" ON "events" USING btree ("created_by_user_id");