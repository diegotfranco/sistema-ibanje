ALTER TABLE "attenders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "attenders" ALTER COLUMN "status" SET DEFAULT 'ativo'::text;--> statement-breakpoint
-- 'inativo' is being dropped from attender_status; it collapsed into the exit (terminal) states.
-- Remap any existing rows to 'desligado' so the cast back to the recreated enum succeeds, and
-- backfill exit metadata where missing so the rows stay domain-consistent.
UPDATE "attenders"
SET "status" = 'desligado',
    "exit_date" = COALESCE("exit_date", CURRENT_DATE),
    "exit_reason" = COALESCE("exit_reason", 'Migrado automaticamente do antigo status "inativo".')
WHERE "status" = 'inativo';--> statement-breakpoint
DROP TYPE "public"."attender_status";--> statement-breakpoint
CREATE TYPE "public"."attender_status" AS ENUM('ativo', 'desligado', 'transferido', 'falecido');--> statement-breakpoint
ALTER TABLE "attenders" ALTER COLUMN "status" SET DEFAULT 'ativo'::"public"."attender_status";--> statement-breakpoint
ALTER TABLE "attenders" ALTER COLUMN "status" SET DATA TYPE "public"."attender_status" USING "status"::"public"."attender_status";