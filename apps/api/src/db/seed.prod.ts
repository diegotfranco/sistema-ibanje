/**
 * Production seed — runs once on first deploy.
 *
 * Inserts structural data only: roles, permissions, modules, role-module-
 * permissions, payment methods, base campaigns, income/expense
 * categories, finance settings, church settings, minute templates.
 *
 * Real data (users, attenders, financial entries, meetings, minutes, monthly
 * closings, membership letters) starts empty in production and is added
 * through the app.
 *
 * Safety: refuses to run if any of the target tables already have rows.
 */
import { sql as drizzleSql } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { db, sql } from './index.js';
import { env } from '../config/env.js';
import { ADMIN_ROLE_NAME } from '../lib/constants.js';
import { copyRolePermissionsToUser } from '../modules/users/repository.js';
import {
  roles,
  permissions,
  modules,
  roleModulePermissions,
  paymentMethods,
  campaigns,
  incomeCategories,
  expenseCategories,
  financeSettings,
  churchSettings,
  minuteTemplates,
  users
} from './schema.js';
import {
  SEED_ROLES,
  SEED_PERMISSIONS,
  EXPECTED_PERMISSION_ORDER,
  SEED_MODULES,
  EXPECTED_MODULE_ORDER,
  SEED_PAYMENT_METHODS,
  SEED_CAMPAIGNS,
  SEED_INCOME_CATEGORY_PARENTS,
  buildIncomeCategoryChildren,
  SEED_EXPENSE_CATEGORY_PARENTS,
  buildExpenseCategoryChildren,
  buildRoleModulePermissions,
  SEED_CHURCH_SETTINGS
} from './seed-data.js';
import { SEED_MINUTE_TEMPLATES } from './seed-templates.js';

export type AdminConfig = { email: string; password: string; name?: string };

/**
 * Resolve the first-admin config from the validated env. Returns undefined when
 * the bootstrap vars are not set, in which case the seed inserts structural data
 * only. Tests pass an explicit config instead.
 */
function adminConfigFromEnv(): AdminConfig | undefined {
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    return { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, name: env.ADMIN_NAME };
  }
  return undefined;
}

export async function seedProd(admin: AdminConfig | undefined = adminConfigFromEnv()) {
  console.log('Production seed starting...');

  await db.transaction(async (tx) => {
    // Refuse to run if structural data already exists. Production seed is one-shot.
    const existing = await tx.execute(drizzleSql`SELECT
      (SELECT COUNT(*) FROM roles) AS roles,
      (SELECT COUNT(*) FROM modules) AS modules,
      (SELECT COUNT(*) FROM permissions) AS permissions,
      (SELECT COUNT(*) FROM payment_methods) AS payment_methods,
      (SELECT COUNT(*) FROM income_categories) AS income_categories,
      (SELECT COUNT(*) FROM expense_categories) AS expense_categories,
      (SELECT COUNT(*) FROM finance_settings) AS finance_settings,
      (SELECT COUNT(*) FROM campaigns) AS campaigns,
      (SELECT COUNT(*) FROM minute_templates) AS minute_templates`);
    const counts = existing[0] as Record<string, number | string>;
    const nonEmpty = Object.entries(counts).filter(([, v]) => Number(v) > 0);
    if (nonEmpty.length > 0) {
      throw new Error(
        `Refusing to seed: target tables already have data: ${nonEmpty
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`
      );
    }

    // --- Roles ---
    const insertedRoles = await tx.insert(roles).values(SEED_ROLES).returning();
    const roleByName = Object.fromEntries(insertedRoles.map((r) => [r.name, r]));

    const insertedPerms = await tx.insert(permissions).values(SEED_PERMISSIONS).returning();
    const permByName = Object.fromEntries(insertedPerms.map((p) => [p.name, p]));
    for (let i = 0; i < EXPECTED_PERMISSION_ORDER.length; i++) {
      if (insertedPerms[i]?.name !== EXPECTED_PERMISSION_ORDER[i]) {
        throw new Error(
          'Seed permission order changed — update packages/shared/src/index.ts Action enum to match.'
        );
      }
    }

    const insertedMods = await tx.insert(modules).values(SEED_MODULES).returning();
    const modByName = Object.fromEntries(insertedMods.map((m) => [m.name, m]));
    for (let i = 0; i < EXPECTED_MODULE_ORDER.length; i++) {
      if (insertedMods[i]?.name !== EXPECTED_MODULE_ORDER[i]) {
        throw new Error(
          `Seed module order changed at index ${i} — update packages/shared/src/index.ts Module enum to match.`
        );
      }
    }

    const rmpRows = buildRoleModulePermissions(
      roleByName,
      modByName,
      permByName,
      insertedMods.map((m) => m.name)
    );
    await tx.insert(roleModulePermissions).values(rmpRows);

    await tx.insert(paymentMethods).values(SEED_PAYMENT_METHODS);

    await tx.insert(campaigns).values(
      SEED_CAMPAIGNS.map((f) => ({
        name: f.name,
        description: f.description ?? null,
        targetAmount: f.targetAmount ?? null
      }))
    );

    const insertedICParents = await tx
      .insert(incomeCategories)
      .values(
        SEED_INCOME_CATEGORY_PARENTS.map((p) => ({ name: p.name, description: p.description }))
      )
      .returning();
    const icParentByName = Object.fromEntries(insertedICParents.map((c) => [c.name, c]));
    await tx.insert(incomeCategories).values(buildIncomeCategoryChildren(icParentByName));

    const insertedECParents = await tx
      .insert(expenseCategories)
      .values(SEED_EXPENSE_CATEGORY_PARENTS)
      .returning();
    const ecParentByName = Object.fromEntries(insertedECParents.map((c) => [c.name, c]));
    await tx.insert(expenseCategories).values(buildExpenseCategoryChildren(ecParentByName));

    await tx.insert(financeSettings).values({ openingBalance: '0.00' });
    await tx.insert(churchSettings).values(SEED_CHURCH_SETTINGS);

    await tx.insert(minuteTemplates).values(
      SEED_MINUTE_TEMPLATES.map((t) => ({
        meetingType: t.meetingType,
        name: t.name,
        isDefault: t.isDefault,
        content: t.content,
        defaultAgendaItems: t.defaultAgendaItems
      }))
    );

    // --- First admin (env-driven, optional) ----------------------------------
    // Bootstraps an initial Administrador so the system is usable on first boot.
    // Set ADMIN_EMAIL + ADMIN_PASSWORD to enable; otherwise structural data is
    // seeded and the first admin must be created some other way.
    if (admin) {
      const adminRole = roleByName[ADMIN_ROLE_NAME];
      if (!adminRole) {
        throw new Error(`Seed role "${ADMIN_ROLE_NAME}" not found — cannot create first admin.`);
      }
      const passwordHash = await argon2.hash(admin.password + env.ARGON2_PEPPER, {
        type: argon2.argon2id
      });
      const [adminUser] = await tx
        .insert(users)
        .values({
          name: admin.name ?? env.ADMIN_NAME,
          email: admin.email,
          passwordHash,
          roleId: adminRole.id,
          status: 'ativo'
        })
        .returning();
      await copyRolePermissionsToUser(adminRole.id, adminUser.id, tx);
      console.log(`First admin created: ${admin.email}`);
    } else {
      console.warn(
        'No admin created — set ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap the first Administrador.'
      );
    }
  });

  console.log('Production seed complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await seedProd();
    await sql.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
