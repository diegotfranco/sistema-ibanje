/**
 * Dev seed — wipes everything and reseeds from structural data + dumped JSON
 * fixtures + synthetic edge-case rows.
 *
 *   - Structural enums (roles, modules, permissions, categories, funds,
 *     payment methods, church settings, minute templates) live in
 *     seed-data.ts + seed-templates.ts and are always inserted.
 *   - Dumped legacy data (attenders, designated-fund campanhas, income and
 *     expense entries filtered to the last 5 years) is loaded from JSON
 *     fixtures committed to `fixtures/`. Run `pnpm db:dump-fixtures` to
 *     regenerate them.
 *   - Edge-case rows (pending users, multi-version minutes, installments,
 *     closings in every status, letters, etc.) come from seed-edge-cases.ts.
 *
 * Foreign keys in fixtures are encoded by NAME / EMAIL — this orchestrator
 * resolves them against newly-inserted rows so re-running seed against a
 * fresh DB always works.
 */
import * as argon2 from 'argon2';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql as drizzleSql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { db, sql } from './index.js';
import {
  SEED_ROLES,
  SEED_PERMISSIONS,
  EXPECTED_PERMISSION_ORDER,
  SEED_MODULES,
  EXPECTED_MODULE_ORDER,
  SEED_PAYMENT_METHODS,
  SEED_DESIGNATED_FUNDS,
  SEED_EVENTS,
  SEED_INCOME_CATEGORY_PARENTS,
  buildIncomeCategoryChildren,
  SEED_EXPENSE_CATEGORY_PARENTS,
  buildExpenseCategoryChildren,
  buildRoleModulePermissions,
  SEED_DEMO_USERS,
  SEED_CHURCH_SETTINGS
} from './seed-data.js';
import { SEED_MINUTE_TEMPLATES } from './seed-templates.js';
import {
  EDGE_CASE_ATTENDERS,
  EDGE_CASE_USERS,
  EDGE_CASE_USER_PERMISSION_OVERRIDES,
  EDGE_CASE_MEETINGS,
  EDGE_CASE_AGENDA_ITEMS,
  EDGE_CASE_MINUTES,
  EDGE_CASE_CLOSINGS,
  EDGE_CASE_INCOME,
  EDGE_CASE_EXPENSES,
  EDGE_CASE_LETTERS
} from './seed-edge-cases.js';
import {
  roles,
  permissions,
  modules,
  users,
  roleModulePermissions,
  userModulePermissions,
  paymentMethods,
  designatedFunds,
  incomeCategories,
  expenseCategories,
  attenders,
  incomeEntries,
  expenseEntries,
  meetings,
  events,
  minutes,
  minuteVersions,
  monthlyClosings,
  financeSettings,
  agendaItems,
  churchSettings,
  minuteTemplates,
  membershipLetters
} from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

function loadFixture<T>(name: string): T {
  const file = path.join(FIXTURES_DIR, name);
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}

async function hashPassword(password: string) {
  return argon2.hash(password + env.ARGON2_PEPPER, { type: argon2.argon2id });
}

// The legacy fixture dump carries no membership data, which left ~97% of seeded
// congregados as non-members — unrealistic. Synthesize it deterministically by row
// index so `db:reset` stays reproducible and the values survive re-dumps of the fixture.
const ADMISSION_MODES = [
  'aclamação',
  'batismo',
  'carta de transferência',
  'profissão de fé'
] as const;

function synthesizeMembership(i: number): {
  isMember: boolean;
  memberSince: string | null;
  admissionMode: (typeof ADMISSION_MODES)[number] | null;
  congregatingSinceYear: number;
} {
  const congregatingSinceYear = 2002 + (i % 21);
  const isMember = i % 20 < 13; // ~65%
  if (!isMember) {
    return { isMember: false, memberSince: null, admissionMode: null, congregatingSinceYear };
  }
  const year = congregatingSinceYear + (i % 4);
  const month = String((i % 12) + 1).padStart(2, '0');
  const day = String((i % 27) + 1).padStart(2, '0');
  return {
    isMember: true,
    memberSince: `${year}-${month}-${day}`,
    admissionMode: ADMISSION_MODES[i % 4],
    congregatingSinceYear
  };
}

// ---------------------------------------------------------------------------
// fixture shapes (match dump-fixtures.ts output)
// ---------------------------------------------------------------------------
type AttenderFixture = {
  name: string;
  birthDate: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
};
type DesignatedFundFixture = {
  name: string;
  description?: string | null;
  targetAmount?: string | null;
  targetDate?: string | null;
  createdAt?: string | null;
};
type IncomeEntryFixture = {
  depositDate: string;
  referenceDate: string;
  amount: string;
  categoryName: string;
  attenderName: string | null;
  paymentMethodName: string;
  designatedFundName: string | null;
  notes: string | null;
};
type ExpenseEntryFixture = {
  date: string;
  total: string;
  amount: string;
  installment: number;
  totalInstallments: number;
  categoryName: string;
  paymentMethodName: string;
  designatedFundName: string | null;
  notes: string | null;
};

export async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed must not run in production');
  }

  console.log('Seeding database (structural data + fixtures + edge cases)...');

  const attendersFixture = loadFixture<AttenderFixture[]>('attenders.json');
  const fundsFixture = loadFixture<DesignatedFundFixture[]>('designated_funds.json');
  const incomeFixture = loadFixture<IncomeEntryFixture[]>('income_entries.json');
  const expenseFixture = loadFixture<ExpenseEntryFixture[]>('expense_entries.json');
  console.log(
    `Fixtures: ${attendersFixture.length} attenders, ${fundsFixture.length} campanha funds, ${incomeFixture.length} income, ${expenseFixture.length} expense.`
  );

  await db.transaction(async (tx) => {
    await tx.execute(
      drizzleSql`TRUNCATE roles, permissions, modules, users, role_module_permissions,
          user_module_permissions, payment_methods, designated_funds,
          income_categories, expense_categories, attenders, income_entries,
          expense_entries, meetings, minutes, minute_versions,
          monthly_closings, finance_settings, church_settings, agenda_items,
          minute_templates, membership_letters
          RESTART IDENTITY CASCADE`
    );

    // --- Roles / Permissions / Modules ----------------------------------------
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

    // --- Role-Module-Permissions ---------------------------------------------
    const rmpRows = buildRoleModulePermissions(
      roleByName,
      modByName,
      permByName,
      insertedMods.map((m) => m.name)
    );
    await tx.insert(roleModulePermissions).values(rmpRows);

    // --- Demo users + permissions (mirrored from role) -----------------------
    const demoUserRows = await Promise.all(
      SEED_DEMO_USERS.map(async (u) => ({
        name: u.name,
        email: u.email,
        passwordHash: await hashPassword(u.password),
        roleId: roleByName[u.roleName].id
      }))
    );
    const insertedDemoUsers = await tx.insert(users).values(demoUserRows).returning();
    const userByEmail = new Map(insertedDemoUsers.map((u) => [u.email, u]));

    // --- Edge-case users (pendente, inativo) ---------------------------------
    const edgeUserRows = await Promise.all(
      EDGE_CASE_USERS.map(async (u) => ({
        name: u.name,
        email: u.email,
        passwordHash: await hashPassword(u.password),
        roleId: roleByName[u.roleName].id,
        status: u.status
      }))
    );
    const insertedEdgeUsers = await tx.insert(users).values(edgeUserRows).returning();
    for (const u of insertedEdgeUsers) userByEmail.set(u.email, u);

    // Mirror role permissions into user_module_permissions for users that
    // should have them (skip pendente users).
    const skipPermsByEmail = new Set(
      EDGE_CASE_USERS.filter((u) => u.skipPermissions).map((u) => u.email)
    );
    const allUsersForPerms = [...insertedDemoUsers, ...insertedEdgeUsers].filter(
      (u) => !skipPermsByEmail.has(u.email)
    );
    const umpRows = allUsersForPerms.flatMap((user) =>
      rmpRows
        .filter((rmp) => rmp.roleId === user.roleId)
        .map((rmp) => ({ userId: user.id, moduleId: rmp.moduleId, permissionId: rmp.permissionId }))
    );

    // Custom permission overrides (extra perms beyond the role).
    const overrideRows = EDGE_CASE_USER_PERMISSION_OVERRIDES.map((o) => {
      const u = userByEmail.get(o.userEmail);
      if (!u) throw new Error(`Permission override references unknown user ${o.userEmail}`);
      return {
        userId: u.id,
        moduleId: modByName[o.moduleName].id,
        permissionId: permByName[o.permissionName].id
      };
    });
    // De-duplicate against the base role-mirrored rows.
    const umpKey = (r: { userId: number; moduleId: number; permissionId: number }) =>
      `${r.userId}:${r.moduleId}:${r.permissionId}`;
    const seenUmp = new Set(umpRows.map(umpKey));
    for (const o of overrideRows) {
      if (!seenUmp.has(umpKey(o))) {
        umpRows.push(o);
        seenUmp.add(umpKey(o));
      }
    }
    await tx.insert(userModulePermissions).values(umpRows);

    // --- Payment methods ------------------------------------------------------
    const insertedPMs = await tx.insert(paymentMethods).values(SEED_PAYMENT_METHODS).returning();
    const pmByName = Object.fromEntries(insertedPMs.map((pm) => [pm.name, pm]));

    // --- Designated funds: structural base + campanha fan-out ---------------
    const baseFundRows = SEED_DESIGNATED_FUNDS.map((f) => ({
      name: f.name,
      description: f.description ?? null,
      targetAmount: f.targetAmount ?? null,
      targetDate: f.targetDate ?? null,
      status: 'ativo' as const,
      ...(f.createdAt ? { createdAt: new Date(f.createdAt), updatedAt: new Date(f.createdAt) } : {})
    }));
    const extraFundRows = fundsFixture.map((f) => ({
      name: f.name,
      description: f.description ?? null,
      targetAmount: f.targetAmount ?? null,
      targetDate: f.targetDate ?? null,
      status: 'ativo' as const,
      ...(f.createdAt ? { createdAt: new Date(f.createdAt), updatedAt: new Date(f.createdAt) } : {})
    }));
    const insertedFunds = await tx
      .insert(designatedFunds)
      .values([...baseFundRows, ...extraFundRows])
      .returning();
    const fundByName = new Map(insertedFunds.map((f) => [f.name, f]));

    // --- Events --------------------------------------------------------------
    const insertedEvents = SEED_EVENTS.length
      ? await tx
          .insert(events)
          .values(
            SEED_EVENTS.map((e) => ({
              title: e.title,
              description: e.description ?? null,
              location: e.location ?? null,
              startTime: new Date(e.startTime),
              endTime: new Date(e.endTime)
            }))
          )
          .returning()
      : [];
    const eventByTitle = new Map(insertedEvents.map((e) => [e.title, e]));

    // --- Income / Expense categories -----------------------------------------
    const insertedICParents = await tx
      .insert(incomeCategories)
      .values(
        SEED_INCOME_CATEGORY_PARENTS.map((p) => ({ name: p.name, description: p.description }))
      )
      .returning();
    const icParentByName = Object.fromEntries(insertedICParents.map((c) => [c.name, c]));
    const insertedICs = await tx
      .insert(incomeCategories)
      .values(buildIncomeCategoryChildren(icParentByName))
      .returning();
    const icByName = new Map(insertedICs.map((c) => [c.name, c]));
    // Parents are also valid categories in the dump (e.g. fallback to a parent if leaf missing)
    for (const p of insertedICParents) icByName.set(p.name, p);

    const insertedECParents = await tx
      .insert(expenseCategories)
      .values(SEED_EXPENSE_CATEGORY_PARENTS)
      .returning();
    const ecParentByName = Object.fromEntries(insertedECParents.map((c) => [c.name, c]));
    const insertedECs = await tx
      .insert(expenseCategories)
      .values(buildExpenseCategoryChildren(ecParentByName))
      .returning();
    const ecByName = new Map(insertedECs.map((c) => [c.name, c]));
    for (const p of insertedECParents) ecByName.set(p.name, p);

    // --- Finance / Church settings -------------------------------------------
    await tx.insert(financeSettings).values({ openingBalance: '0.00' });
    await tx.insert(churchSettings).values(SEED_CHURCH_SETTINGS);

    // --- Minute templates ----------------------------------------------------
    const adminId = userByEmail.get('admin@email.com')!.id;
    await tx.insert(minuteTemplates).values(
      SEED_MINUTE_TEMPLATES.map((t) => ({
        meetingType: t.meetingType,
        name: t.name,
        isDefault: t.isDefault,
        content: t.content,
        defaultAgendaItems: t.defaultAgendaItems,
        createdByUserId: adminId
      }))
    );

    // --- Attenders: dumped fixture + edge cases -------------------------------
    const fixtureAttenderRows = attendersFixture.map((a, i) => ({
      name: a.name,
      birthDate: a.birthDate,
      addressStreet: a.addressStreet,
      addressNumber: a.addressNumber,
      addressComplement: a.addressComplement,
      addressDistrict: a.addressDistrict,
      state: a.state,
      city: a.city,
      postalCode: a.postalCode,
      email: a.email,
      phone: a.phone,
      ...synthesizeMembership(i)
    }));
    const insertedFixtureAttenders = fixtureAttenderRows.length
      ? await tx.insert(attenders).values(fixtureAttenderRows).returning()
      : [];

    // Edge-case attenders, deduped against the fixture names (legacy data
    // might already include someone with the same name).
    const existingAttenderNames = new Set(insertedFixtureAttenders.map((a) => a.name));
    const edgeAttenderRows = EDGE_CASE_ATTENDERS.filter(
      (a) => !existingAttenderNames.has(a.name)
    ).map((a) => ({
      name: a.name,
      userId: a.linkToUserEmail ? (userByEmail.get(a.linkToUserEmail)?.id ?? null) : null,
      birthDate: a.birthDate ?? null,
      addressStreet: a.addressStreet ?? null,
      addressNumber: a.addressNumber ?? null,
      addressDistrict: a.addressDistrict ?? null,
      state: a.state ?? null,
      city: a.city ?? null,
      postalCode: a.postalCode ?? null,
      email: a.email ?? null,
      phone: a.phone ?? null,
      isMember: a.isMember ?? false,
      memberSince: a.memberSince ?? null,
      congregatingSinceYear: a.congregatingSinceYear ?? null,
      admissionMode: a.admissionMode ?? null
    }));
    const insertedEdgeAttenders = edgeAttenderRows.length
      ? await tx.insert(attenders).values(edgeAttenderRows).returning()
      : [];
    const attenderByName = new Map(
      [...insertedFixtureAttenders, ...insertedEdgeAttenders].map((a) => [a.name, a])
    );

    // --- Income entries (from fixture) ---------------------------------------
    const tesoureiroId = userByEmail.get('tesoureiro@email.com')!.id;

    const incomeRows = incomeFixture.map((e) => {
      const category = icByName.get(e.categoryName);
      if (!category) throw new Error(`Unknown income category "${e.categoryName}"`);
      const pm = pmByName[e.paymentMethodName];
      if (!pm) throw new Error(`Unknown payment method "${e.paymentMethodName}"`);
      const attender = e.attenderName ? attenderByName.get(e.attenderName) : null;
      const fund = e.designatedFundName ? fundByName.get(e.designatedFundName) : null;
      return {
        referenceDate: e.referenceDate,
        depositDate: e.depositDate,
        amount: e.amount,
        categoryId: category.id,
        attenderId: attender?.id ?? null,
        paymentMethodId: pm.id,
        designatedFundId: fund?.id ?? null,
        notes: e.notes,
        status: 'paga' as const,
        userId: tesoureiroId
      };
    });
    const BATCH = 500;
    for (let i = 0; i < incomeRows.length; i += BATCH) {
      await tx.insert(incomeEntries).values(incomeRows.slice(i, i + BATCH));
    }

    // --- Expense entries (from fixture) --------------------------------------
    const expenseRows = expenseFixture.map((e) => {
      const category = ecByName.get(e.categoryName);
      if (!category) throw new Error(`Unknown expense category "${e.categoryName}"`);
      const pm = pmByName[e.paymentMethodName];
      if (!pm) throw new Error(`Unknown payment method "${e.paymentMethodName}"`);
      const fund = e.designatedFundName ? fundByName.get(e.designatedFundName) : null;
      return {
        date: e.date,
        total: e.total,
        amount: e.amount,
        installment: e.installment,
        totalInstallments: e.totalInstallments,
        categoryId: category.id,
        paymentMethodId: pm.id,
        designatedFundId: fund?.id ?? null,
        notes: e.notes,
        status: 'paga' as const,
        userId: tesoureiroId
      };
    });
    for (let i = 0; i < expenseRows.length; i += BATCH) {
      await tx.insert(expenseEntries).values(expenseRows.slice(i, i + BATCH));
    }

    // --- Edge-case meetings + agenda + minutes -------------------------------
    const insertedMeetings = await tx
      .insert(meetings)
      .values(
        EDGE_CASE_MEETINGS.map((m) => ({
          meetingDate: m.meetingDate,
          type: m.type,
          isPublic: m.isPublic ?? false
        }))
      )
      .returning();
    const meetingByDate = new Map(insertedMeetings.map((m) => [m.meetingDate, m]));

    if (EDGE_CASE_AGENDA_ITEMS.length) {
      await tx.insert(agendaItems).values(
        EDGE_CASE_AGENDA_ITEMS.map((a) => {
          const meeting = meetingByDate.get(a.meetingDate);
          if (!meeting) throw new Error(`Agenda item references unknown meeting ${a.meetingDate}`);
          const u = userByEmail.get(a.createdByUserEmail);
          if (!u) throw new Error(`Agenda item references unknown user ${a.createdByUserEmail}`);
          return {
            meetingId: meeting.id,
            order: a.order,
            title: a.title,
            description: a.description ?? null,
            createdByUserId: u.id
          };
        })
      );
    }

    for (const m of EDGE_CASE_MINUTES) {
      const meeting = meetingByDate.get(m.meetingDate);
      if (!meeting)
        throw new Error(`Minute ${m.minuteNumber} references unknown meeting ${m.meetingDate}`);
      const [insertedMinute] = await tx
        .insert(minutes)
        .values({
          meetingId: meeting.id,
          minuteNumber: m.minuteNumber,
          presidingPastorName: m.presidingPastorName ?? null,
          secretaryName: m.secretaryName ?? null,
          openingTime: m.openingTime ?? null,
          closingTime: m.closingTime ?? null
        })
        .returning();
      await tx.insert(minuteVersions).values(
        m.versions.map((v) => {
          const u = userByEmail.get(v.createdByUserEmail);
          if (!u) throw new Error(`Minute version references unknown user ${v.createdByUserEmail}`);
          const approvedMeeting = v.approvedAtMeetingDate
            ? meetingByDate.get(v.approvedAtMeetingDate)
            : null;
          return {
            minuteId: insertedMinute.id,
            version: v.version,
            status: v.status,
            reasonForChange: v.reasonForChange,
            createdByUserId: u.id,
            approvedAtMeetingId: approvedMeeting?.id ?? null,
            content: v.contentJson
          };
        })
      );
    }

    // --- Edge-case monthly closings ------------------------------------------
    if (EDGE_CASE_CLOSINGS.length) {
      await tx.insert(monthlyClosings).values(
        EDGE_CASE_CLOSINGS.map((c) => ({
          periodYear: c.periodYear,
          periodMonth: c.periodMonth,
          status: c.status,
          closingBalance: c.closingBalance ?? null,
          treasurerNotes: c.treasurerNotes ?? null,
          accountantNotes: c.accountantNotes ?? null,
          submittedByUserId: c.submittedByUserEmail
            ? (userByEmail.get(c.submittedByUserEmail)?.id ?? null)
            : null,
          closedByUserId: c.closedByUserEmail
            ? (userByEmail.get(c.closedByUserEmail)?.id ?? null)
            : null
        }))
      );
    }

    // --- Edge-case finance entries -------------------------------------------
    if (EDGE_CASE_INCOME.length) {
      await tx.insert(incomeEntries).values(
        EDGE_CASE_INCOME.map((e) => {
          const category = icByName.get(e.categoryName);
          if (!category)
            throw new Error(`Edge income references unknown category ${e.categoryName}`);
          const pm = pmByName[e.paymentMethodName];
          if (!pm)
            throw new Error(`Edge income references unknown payment method ${e.paymentMethodName}`);
          const u = userByEmail.get(e.createdByUserEmail);
          if (!u) throw new Error(`Edge income references unknown user ${e.createdByUserEmail}`);
          const attender = e.attenderName ? attenderByName.get(e.attenderName) : null;
          const fund = e.designatedFundName ? fundByName.get(e.designatedFundName) : null;
          const evt = e.eventTitle ? eventByTitle.get(e.eventTitle) : null;
          return {
            referenceDate: e.referenceDate,
            depositDate: e.depositDate ?? e.referenceDate,
            amount: e.amount,
            categoryId: category.id,
            attenderId: attender?.id ?? null,
            paymentMethodId: pm.id,
            designatedFundId: fund?.id ?? null,
            eventId: evt?.id ?? null,
            notes: e.notes ?? null,
            status: 'paga' as const,
            userId: u.id
          };
        })
      );
    }

    // Expense edge cases — installments need a parent_id resolution pass.
    const parentIdByGroup = new Map<string, number>();
    const parentEdgeExpenses = EDGE_CASE_EXPENSES.filter((e) => e.isInstallmentParent);
    if (parentEdgeExpenses.length) {
      const insertedParents = await tx
        .insert(expenseEntries)
        .values(
          parentEdgeExpenses.map((e) => {
            const category = ecByName.get(e.categoryName);
            if (!category)
              throw new Error(`Edge expense references unknown category ${e.categoryName}`);
            const pm = pmByName[e.paymentMethodName];
            const u = userByEmail.get(e.createdByUserEmail);
            if (!u) throw new Error(`Edge expense references unknown user ${e.createdByUserEmail}`);
            const fund = e.designatedFundName ? fundByName.get(e.designatedFundName) : null;
            const evt = e.eventTitle ? eventByTitle.get(e.eventTitle) : null;
            return {
              date: e.date,
              total: e.total,
              amount: e.amount,
              installment: e.installment,
              totalInstallments: e.totalInstallments,
              categoryId: category.id,
              paymentMethodId: pm.id,
              designatedFundId: fund?.id ?? null,
              eventId: evt?.id ?? null,
              notes: e.notes ?? null,
              status: 'paga' as const,
              userId: u.id
            };
          })
        )
        .returning();
      parentEdgeExpenses.forEach((e, i) => {
        if (e.installmentGroupId) parentIdByGroup.set(e.installmentGroupId, insertedParents[i].id);
      });
    }
    const remainingEdgeExpenses = EDGE_CASE_EXPENSES.filter((e) => !e.isInstallmentParent);
    if (remainingEdgeExpenses.length) {
      await tx.insert(expenseEntries).values(
        remainingEdgeExpenses.map((e) => {
          const category = ecByName.get(e.categoryName);
          if (!category)
            throw new Error(`Edge expense references unknown category ${e.categoryName}`);
          const pm = pmByName[e.paymentMethodName];
          const u = userByEmail.get(e.createdByUserEmail);
          if (!u) throw new Error(`Edge expense references unknown user ${e.createdByUserEmail}`);
          const fund = e.designatedFundName ? fundByName.get(e.designatedFundName) : null;
          const evt = e.eventTitle ? eventByTitle.get(e.eventTitle) : null;
          return {
            date: e.date,
            total: e.total,
            amount: e.amount,
            installment: e.installment,
            totalInstallments: e.totalInstallments,
            categoryId: category.id,
            paymentMethodId: pm.id,
            designatedFundId: fund?.id ?? null,
            eventId: evt?.id ?? null,
            parentId: e.installmentGroupId
              ? (parentIdByGroup.get(e.installmentGroupId) ?? null)
              : null,
            notes: e.notes ?? null,
            status: 'paga' as const,
            userId: u.id
          };
        })
      );
    }

    // --- Edge-case membership letters ----------------------------------------
    if (EDGE_CASE_LETTERS.length) {
      await tx.insert(membershipLetters).values(
        EDGE_CASE_LETTERS.map((l) => {
          const attender = attenderByName.get(l.attenderName);
          if (!attender) throw new Error(`Letter references unknown attender ${l.attenderName}`);
          const u = userByEmail.get(l.createdByUserEmail);
          if (!u) throw new Error(`Letter references unknown user ${l.createdByUserEmail}`);
          return {
            attenderId: attender.id,
            type: l.type,
            letterDate: l.letterDate,
            otherChurchName: l.otherChurchName,
            otherChurchAddress: l.otherChurchAddress ?? null,
            otherChurchCity: l.otherChurchCity,
            otherChurchState: l.otherChurchState ?? null,
            signingSecretaryName: l.signingSecretaryName,
            signingSecretaryTitle: l.signingSecretaryTitle,
            signingPresidentName: l.signingPresidentName,
            signingPresidentTitle: l.signingPresidentTitle,
            additionalContext: l.additionalContext ?? null,
            createdByUserId: u.id
          };
        })
      );
    }

    console.log(
      `Inserted: ${insertedFixtureAttenders.length + insertedEdgeAttenders.length} attenders, ${incomeRows.length + EDGE_CASE_INCOME.length} income, ${expenseRows.length + EDGE_CASE_EXPENSES.length} expense, ${insertedMeetings.length} meetings, ${EDGE_CASE_MINUTES.length} minutes, ${EDGE_CASE_CLOSINGS.length} closings, ${EDGE_CASE_LETTERS.length} letters.`
    );
  });

  console.log('Seeding complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await seed();
    await sql.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
