ALTER TABLE "events" DROP CONSTRAINT "events_created_by_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "events_created_by_user_id_idx";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "recurrence";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "created_by_user_id";--> statement-breakpoint
DROP TYPE "public"."event_type";--> statement-breakpoint
DROP TYPE "public"."recurrence_type";