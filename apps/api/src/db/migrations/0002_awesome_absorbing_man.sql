ALTER TABLE "attenders" DROP CONSTRAINT "attenders_user_id_unique";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_name_unique";--> statement-breakpoint
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_name_unique";--> statement-breakpoint
ALTER TABLE "attenders" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "designated_funds" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "income_categories" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "calendar_entries" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "attenders_deleted_at_idx" ON "attenders" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attenders_user_id_active" ON "attenders" USING btree ("user_id") WHERE "attenders"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_roles_name_active" ON "roles" USING btree ("name") WHERE "roles"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "roles_deleted_at_idx" ON "roles" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "designated_funds_deleted_at_idx" ON "designated_funds" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "expense_categories_deleted_at_idx" ON "expense_categories" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "income_categories_deleted_at_idx" ON "income_categories" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payment_methods_name_active" ON "payment_methods" USING btree ("name") WHERE "payment_methods"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "payment_methods_deleted_at_idx" ON "payment_methods" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "agenda_items_deleted_at_idx" ON "agenda_items" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "meetings_deleted_at_idx" ON "meetings" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "events_deleted_at_idx" ON "events" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "calendar_entries_deleted_at_idx" ON "calendar_entries" USING btree ("deleted_at");