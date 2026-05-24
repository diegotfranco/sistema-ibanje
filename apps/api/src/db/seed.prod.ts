/**
 * Production seed — runs once on first deploy.
 *
 * Inserts structural data only: roles, permissions, modules, role-module-
 * permissions, payment methods, base designated funds, income/expense
 * categories, finance settings, church settings, minute templates.
 *
 * Real data (users, attenders, financial entries, meetings, minutes, monthly
 * closings, membership letters) starts empty in production and is added
 * through the app.
 *
 * Safety: refuses to run if any of the target tables already have rows.
 */
import { sql as drizzleSql } from 'drizzle-orm';
import { db, sql } from './index.js';
import {
  roles,
  permissions,
  modules,
  roleModulePermissions,
  paymentMethods,
  designatedFunds,
  incomeCategories,
  expenseCategories,
  financeSettings,
  churchSettings,
  minuteTemplates
} from './schema.js';
import {
  SEED_ROLES,
  SEED_PERMISSIONS,
  EXPECTED_PERMISSION_ORDER,
  SEED_MODULES,
  EXPECTED_MODULE_ORDER,
  SEED_PAYMENT_METHODS,
  SEED_DESIGNATED_FUNDS,
  SEED_INCOME_CATEGORY_PARENTS,
  buildIncomeCategoryChildren,
  SEED_EXPENSE_CATEGORY_PARENTS,
  buildExpenseCategoryChildren,
  buildRoleModulePermissions,
  SEED_CHURCH_SETTINGS
} from './seed-data.js';
import { SEED_MINUTE_TEMPLATES } from './seed-templates.js';

export async function seedProd() {
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
      (SELECT COUNT(*) FROM designated_funds) AS designated_funds,
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

    await tx.insert(designatedFunds).values(
      SEED_DESIGNATED_FUNDS.map((f) => ({
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
