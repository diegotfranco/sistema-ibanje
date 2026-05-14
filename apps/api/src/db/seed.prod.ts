/**
 * Production seed — runs once on first deploy.
 *
 * Inserts structural data (roles, permissions, modules, role-module-permissions,
 * payment methods, income/expense categories, finance settings) and migrates
 * members from the legacy SQLite DB at LEGACY_SQLITE_PATH.
 *
 * Skips: users, financial entries, designated funds, board meetings, minutes,
 * monthly closings. Those start fresh.
 *
 * Safety: refuses to run if any of the target tables already have rows.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { sql as drizzleSql } from 'drizzle-orm';
import { db, sql } from './index.js';
import {
  roles,
  permissions,
  modules,
  roleModulePermissions,
  paymentMethods,
  incomeCategories,
  expenseCategories,
  members,
  financeSettings
} from './schema.js';
import {
  SEED_ROLES,
  SEED_PERMISSIONS,
  EXPECTED_PERMISSION_ORDER,
  SEED_MODULES,
  EXPECTED_MODULE_ORDER,
  SEED_PAYMENT_METHODS,
  SEED_INCOME_CATEGORY_PARENTS,
  buildIncomeCategoryChildren,
  buildRoleModulePermissions
} from './seed-data.js';

const LEGACY_SQLITE_PATH =
  process.env.LEGACY_SQLITE_PATH ?? path.resolve(process.cwd(), 'ibanje.db');

type LegacyMember = {
  nome: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  numero: number | null;
  complemento: string | null;
  bairro: string | null;
  uf: string | null;
  cidade: string | null;
  cep: string | null;
  email: string | null;
  celular: string | null;
};

function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function cleanCep(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  const digits = s.replace(/\D/g, '');
  return digits.length === 8 ? digits : null;
}

function cleanUf(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  const up = s.toUpperCase();
  return up.length === 2 ? up : null;
}

function cleanPhone(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  return s.length > 16 ? s.slice(0, 16) : s;
}
function cleanBirthDate(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const year = Number(s.slice(0, 4));
  if (year < 1900 || year > 2026) return null;
  return s;
}

function readLegacyMembers(): LegacyMember[] {
  const legacy = new DatabaseSync(LEGACY_SQLITE_PATH, { readOnly: true });
  try {
    return legacy.prepare('SELECT * FROM membros').all() as unknown as LegacyMember[];
  } finally {
    legacy.close();
  }
}

export async function seedProd() {
  console.log('Production seed starting...');
  console.log(`Reading legacy SQLite from: ${LEGACY_SQLITE_PATH}`);

  const legacyMembers = readLegacyMembers();
  console.log(`Found ${legacyMembers.length} legacy members.`);

  await db.transaction(async (tx) => {
    // Refuse to run if structural data already exists. Production seed is one-shot.
    const existing = await tx.execute(drizzleSql`SELECT
      (SELECT COUNT(*) FROM roles) AS roles,
      (SELECT COUNT(*) FROM modules) AS modules,
      (SELECT COUNT(*) FROM permissions) AS permissions,
      (SELECT COUNT(*) FROM members) AS members,
      (SELECT COUNT(*) FROM payment_methods) AS payment_methods,
      (SELECT COUNT(*) FROM income_categories) AS income_categories,
      (SELECT COUNT(*) FROM expense_categories) AS expense_categories,
      (SELECT COUNT(*) FROM finance_settings) AS finance_settings`);
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

    // ORDER MATTERS — IDs referenced by packages/shared/src/index.ts (Action enum). APPEND ONLY.
    const insertedPerms = await tx.insert(permissions).values(SEED_PERMISSIONS).returning();
    const permByName = Object.fromEntries(insertedPerms.map((p) => [p.name, p]));
    for (let i = 0; i < EXPECTED_PERMISSION_ORDER.length; i++) {
      if (insertedPerms[i]?.name !== EXPECTED_PERMISSION_ORDER[i]) {
        throw new Error(
          'Seed permission order changed — update packages/shared/src/index.ts Action enum to match.'
        );
      }
    }

    // ORDER MATTERS — IDs referenced by packages/shared/src/index.ts (Module enum). APPEND ONLY.
    const insertedMods = await tx.insert(modules).values(SEED_MODULES).returning();
    const modByName = Object.fromEntries(insertedMods.map((m) => [m.name, m]));
    for (let i = 0; i < EXPECTED_MODULE_ORDER.length; i++) {
      if (insertedMods[i]?.name !== EXPECTED_MODULE_ORDER[i]) {
        throw new Error(
          `Seed module order changed at index ${i} — update packages/shared/src/index.ts Module enum to match.`
        );
      }
    }

    // --- Role-Module-Permissions ---
    const rmpRows = buildRoleModulePermissions(
      roleByName,
      modByName,
      permByName,
      insertedMods.map((m) => m.name)
    );
    await tx.insert(roleModulePermissions).values(rmpRows);

    // --- Payment Methods ---
    await tx.insert(paymentMethods).values(SEED_PAYMENT_METHODS);

    // --- Income Categories (2-level chart of accounts) ---
    const insertedICParents = await tx
      .insert(incomeCategories)
      .values(SEED_INCOME_CATEGORY_PARENTS.map((name) => ({ name })))
      .returning();
    const icParentByName = Object.fromEntries(insertedICParents.map((c) => [c.name, c]));
    await tx.insert(incomeCategories).values(buildIncomeCategoryChildren(icParentByName));

    // --- Expense Categories (2-level chart of accounts) ---
    const [ecPessoal, ecOperacional, ecManutencao, ecEquipamentos, ecEventos] = await tx
      .insert(expenseCategories)
      .values([
        { name: 'Pessoal' },
        { name: 'Operacional' },
        { name: 'Manutenção' },
        { name: 'Equipamentos' },
        { name: 'Eventos / Programas' }
      ])
      .returning();

    await tx.insert(expenseCategories).values([
      { name: 'Honorários Pastorais', parentId: ecPessoal.id },
      { name: 'FGTM', parentId: ecPessoal.id },
      { name: 'Encargos', parentId: ecPessoal.id },
      { name: 'Água', parentId: ecOperacional.id },
      { name: 'Energia', parentId: ecOperacional.id },
      { name: 'Internet / Telefone', parentId: ecOperacional.id },
      { name: 'Vigilância Patrimonial', parentId: ecOperacional.id },
      { name: 'Tarifa Bancária', parentId: ecOperacional.id },
      { name: 'Material de Limpeza', parentId: ecOperacional.id },
      { name: 'Manutenção Predial', parentId: ecManutencao.id },
      { name: 'Reparo Hidráulico', parentId: ecManutencao.id },
      { name: 'Reparo Elétrico', parentId: ecManutencao.id },
      { name: 'Compra de Equipamentos', parentId: ecEquipamentos.id },
      { name: 'Despesas com Eventos', parentId: ecEventos.id }
    ]);

    // --- Finance Settings (singleton) ---
    await tx.insert(financeSettings).values({ openingBalance: '0.00' });

    // --- Members (migrated from legacy SQLite) ---
    const memberRows = legacyMembers
      .map((m) => {
        const name = clean(m.nome);
        if (!name) return null;
        return {
          name,
          birthDate: cleanBirthDate(m.data_nascimento),
          addressStreet: clean(m.endereco),
          addressNumber:
            typeof m.numero === 'number' && Number.isFinite(m.numero) ? m.numero : null,
          addressComplement: clean(m.complemento),
          addressDistrict: clean(m.bairro),
          state: cleanUf(m.uf),
          city: clean(m.cidade),
          postalCode: cleanCep(m.cep),
          email: clean(m.email),
          phone: cleanPhone(m.celular)
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    if (memberRows.length > 0) {
      await tx.insert(members).values(memberRows);
    }
    console.log(`Inserted ${memberRows.length} members.`);
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
