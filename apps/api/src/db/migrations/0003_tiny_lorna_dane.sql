ALTER TABLE "designated_funds" RENAME COLUMN "goal_amount" TO "target_amount";--> statement-breakpoint
ALTER TABLE "income_categories" RENAME COLUMN "requires_donor" TO "requires_member";--> statement-breakpoint
ALTER TABLE "expense_entries" ADD COLUMN "member_id" integer;--> statement-breakpoint
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;