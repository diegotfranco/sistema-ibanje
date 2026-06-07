CREATE TYPE "public"."attender_status" AS ENUM('ativo', 'inativo', 'desligado', 'transferido', 'falecido');--> statement-breakpoint
CREATE TYPE "public"."fund_status" AS ENUM('ativa', 'encerrada');--> statement-breakpoint
ALTER TABLE "attenders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attenders" ALTER COLUMN "status" SET DATA TYPE "public"."attender_status" USING "status"::text::"public"."attender_status";--> statement-breakpoint
ALTER TABLE "attenders" ALTER COLUMN "status" SET DEFAULT 'ativo';--> statement-breakpoint
ALTER TABLE "designated_funds" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "designated_funds" ALTER COLUMN "status" SET DATA TYPE "public"."fund_status" USING (CASE "status"::text WHEN 'inativo' THEN 'encerrada' ELSE 'ativa' END)::"public"."fund_status";--> statement-breakpoint
ALTER TABLE "designated_funds" ALTER COLUMN "status" SET DEFAULT 'ativa';--> statement-breakpoint
ALTER TABLE "attenders" ADD COLUMN "exit_date" date;--> statement-breakpoint
ALTER TABLE "attenders" ADD COLUMN "exit_reason" varchar(256);--> statement-breakpoint
ALTER TABLE "attenders" ADD COLUMN "exit_letter_id" integer;