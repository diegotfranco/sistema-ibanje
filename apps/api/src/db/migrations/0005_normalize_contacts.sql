-- Backfill existing rows to the boundary-normalized form BEFORE shrinking the columns, so the
-- stripped values fit the new widths. New writes are normalized by the Zod request schemas
-- (src/lib/normalize.ts); this one-time backfill brings legacy rows in line.

-- Documents/contacts -> raw digits.
UPDATE "church_settings" SET "cnpj" = regexp_replace("cnpj", '\D', '', 'g') WHERE "cnpj" IS NOT NULL;--> statement-breakpoint
UPDATE "church_settings" SET "phone" = regexp_replace("phone", '\D', '', 'g') WHERE "phone" IS NOT NULL;--> statement-breakpoint
UPDATE "attenders" SET "phone" = regexp_replace("phone", '\D', '', 'g') WHERE "phone" IS NOT NULL;--> statement-breakpoint

-- Email -> trimmed lowercase. NOTE: if two users differ only by letter case, the unique email
-- index will reject this UPDATE and abort the migration. Resolve any such duplicates first
-- (query: SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1).
UPDATE "church_settings" SET "email" = lower(btrim("email")) WHERE "email" IS NOT NULL;--> statement-breakpoint
UPDATE "users" SET "email" = lower(btrim("email")) WHERE "email" IS NOT NULL;--> statement-breakpoint
UPDATE "attenders" SET "email" = lower(btrim("email")) WHERE "email" IS NOT NULL;--> statement-breakpoint

-- State/UF -> uppercase.
UPDATE "church_settings" SET "address_state" = upper(btrim("address_state")) WHERE "address_state" IS NOT NULL;--> statement-breakpoint
UPDATE "attenders" SET "state" = upper(btrim("state")) WHERE "state" IS NOT NULL;--> statement-breakpoint

-- Shrink the columns now that every stored value is digits-only.
ALTER TABLE "church_settings" ALTER COLUMN "cnpj" SET DATA TYPE varchar(14);--> statement-breakpoint
ALTER TABLE "church_settings" ALTER COLUMN "phone" SET DATA TYPE varchar(11);--> statement-breakpoint
ALTER TABLE "attenders" ALTER COLUMN "phone" SET DATA TYPE varchar(11);
