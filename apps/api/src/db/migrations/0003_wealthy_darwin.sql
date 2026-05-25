-- Merge `Tesoureiro Responsável` into `Tesoureiro` and `Secretário Responsável` into `Secretário`.
-- The merged role inherits the higher tier (with Remover); see seed-data.ts buildRoleModulePermissions.
-- Per CLAUDE.md, `user_module_permissions` is the runtime source of truth, so existing users keep
-- the permissions they were granted at creation; this migration only remaps their role_id and
-- removes the orphan role rows. The CASCADE on role_module_permissions.role_id cleans templates.

UPDATE "users"
SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'Tesoureiro')
WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'Tesoureiro Responsável');
--> statement-breakpoint

UPDATE "users"
SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'Secretário')
WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'Secretário Responsável');
--> statement-breakpoint

DELETE FROM "roles" WHERE "name" IN ('Tesoureiro Responsável', 'Secretário Responsável');
