/**
 * Dev seed — wipes everything and reseeds from synthetic structural data
 * plus REAL historical financial data migrated from the legacy SQLite DB.
 *
 * Income rows: each legacy row may have up to 5 positive amount columns
 * (dízimo, doação terenos, doação missões, doação PAM, doação campanha);
 * each positive value becomes its own income entry with the appropriate
 * category and (where relevant) designated fund.
 *
 * Expense rows: legacy `destino` is free text — mapped to seeded
 * categories via an ordered list of substring patterns. Unmapped entries
 * fall through to a catch-all "Outras Despesas" category and are flagged
 * in the notes field for later review.
 *
 * Member linking on income entries: legacy names are matched to the
 * `members` table by exact normalized form first, then by a conservative
 * fuzzy fallback (token-subset or Levenshtein distance ≤ 2 on the
 * deaccented/lowercased form). Fuzzy-linked entries get a note recording
 * the legacy spelling so they can be reviewed. Unlinked names that look
 * like a person also get a note for review.
 */
import * as argon2 from 'argon2';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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
  SEED_INCOME_CATEGORY_PARENTS,
  buildIncomeCategoryChildren,
  SEED_EXPENSE_CATEGORY_PARENTS,
  buildExpenseCategoryChildren,
  buildRoleModulePermissions,
  SEED_MEETING_TYPES
} from './seed-data.js';
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
  minutes,
  minuteVersions,
  financeSettings,
  agendaItems,
  churchSettings,
  minuteTemplates
} from './schema.js';

const LEGACY_SQLITE_PATH =
  process.env.LEGACY_SQLITE_PATH ?? path.resolve(process.cwd(), 'ibanje.db');

// --- helpers ---
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
function normalizeName(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function parseAmount(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function fmtMoney(n: number): string {
  return n.toFixed(2);
}
function isValidDate(s: string | null): boolean {
  if (!s) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (y < 2020 || y > 2026) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  return true;
}
// Repair dates where month > 12 — almost always a day/month transposition in the legacy data.
function repairDate(s: string | null): string | null {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (m > 12 && d >= 1 && d <= 12) {
    return `${String(y).padStart(4, '0')}-${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
  }
  return s;
}
function cleanBirthDate(s: string | null): string | null {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const year = Number(s.slice(0, 4));
  if (year < 1900 || year > 2026) return null;
  return s;
}
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

async function hashPassword(password: string) {
  return argon2.hash(password + env.ARGON2_PEPPER, { type: argon2.argon2id });
}

// --- legacy types ---
type LegacyAttender = {
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
type LegacyEntrada = {
  nome: string | null;
  data_referencia: string;
  data_deposito: string;
  dizimo: number | string | null;
  doacao_terenos: number | string | null;
  doacao_missoes: number | string | null;
  doacao_pam: number | string | null;
  campanha_nome: string | null;
  doacao_campanha: number | string | null;
  forma_pagamento: string;
};
type LegacySaida = { destino: string; valor: number; data: string };

function readLegacy() {
  if (!existsSync(LEGACY_SQLITE_PATH)) {
    return {
      membros: [] as LegacyAttender[],
      entradas: [] as LegacyEntrada[],
      saidas: [] as LegacySaida[]
    };
  }
  const legacy = new DatabaseSync(LEGACY_SQLITE_PATH, { readOnly: true });
  try {
    return {
      membros: legacy.prepare('SELECT * FROM membros').all() as unknown as LegacyAttender[],
      entradas: legacy.prepare('SELECT * FROM entradas').all() as unknown as LegacyEntrada[],
      saidas: legacy.prepare('SELECT * FROM saidas').all() as unknown as LegacySaida[]
    };
  } finally {
    legacy.close();
  }
}

// --- expense destino → category mapping ---
// Substring patterns checked in order; first match wins. Matched against the
// normalized (deaccented/lowercased) destino.
type DestinoRule = { match: RegExp; category: string };
const DESTINO_RULES: DestinoRule[] = [
  // Pastoral
  {
    match: /honorari[oa] pastoral|honorario pr|honor pr|honorario do pastor/,
    category: 'Honorários Pastorais'
  },
  {
    match: /ferias.*pastor|um terco de ferias|13.*pastor|13.*salario/,
    category: 'Honorários Pastorais'
  },
  { match: /fgtm/, category: 'FGTM' },
  // Encargos / impostos
  { match: /darf|inss|imposto/, category: 'Encargos' },
  // Bancário
  {
    match: /tarifa banc|cesta de relacion|tarifa sicredi|tarifa.*banco/,
    category: 'Tarifa Bancária'
  },
  // Utilidades
  { match: /agua|guariroba/, category: 'Água' },
  { match: /energisa|energia|^luz| luz/, category: 'Energia' },
  { match: /internet|claro|telefone/, category: 'Internet / Telefone' },
  { match: /digital seguranca|seguranca|vigilancia/, category: 'Vigilância Patrimonial' },
  // Operacional — serviços recorrentes
  { match: /contador|contabil/, category: 'Contador' },
  {
    match: /material de expediente|expediente|papelaria|escritorio|impressos|copia/,
    category: 'Material de Expediente'
  },
  { match: /limpe[sz]a|material de limpeza|higiene/, category: 'Material de Limpeza' },
  { match: /jardin/, category: 'Manutenção Predial' },
  { match: /encanamento|hidraulic|reparo hidr/, category: 'Reparo Hidráulico' },
  { match: /eletric|reparo elet/, category: 'Reparo Elétrico' },
  { match: /chave|chaveiro|fechadura/, category: 'Manutenção Predial' },
  { match: /material construcao|construcao|tinta|pintura|fachada/, category: 'Manutenção Predial' },
  { match: /manuten/, category: 'Manutenção Predial' },
  // Auxílios
  { match: /combustivel/, category: 'Auxílio Combustível' },
  // Missões (PAM first — more specific than generic "missões")
  {
    match: /pam|plano de auxilio missionario|plano auxilio.*seminarista|auxilio.*missionario/,
    category: 'PAM'
  },
  { match: /missoes nacionais|missao nacional/, category: 'Missões Nacionais' },
  { match: /miss[oõ]+es mundiais|missao mundial|missoes mund/, category: 'Missões Mundiais' },
  { match: /uniao feminina|gideoes/, category: 'Missões Nacionais' },
  {
    match: /auxilio a seminarista|mensalidade seminarista|seminarista/,
    category: 'Auxílio a Seminarista'
  },
  {
    match: /auxilio a pr em formacao|pastor em formacao|pos graduacao|aux pos|aux pr formacao/,
    category: 'Auxílio a Pastor em Formação'
  },
  { match: /abono|pecunia/, category: 'Honorários Pastorais' },
  // Contribuições eclesiásticas
  { match: /plano cooperativo/, category: 'Plano Cooperativo' },
  { match: /acibams/, category: 'Acibams' },
  // Equipamentos
  { match: /compra de equip|aquisicao de equip|equipamento/, category: 'Compra de Equipamentos' },
  // Eventos / programas
  {
    match: /retiro|acampamento|encontro|confraterniz|pascoa|natal|aniversari|evento/,
    category: 'Despesas com Eventos'
  },
  { match: /didatic|literatura|livros|ebd/, category: 'Material Didático' },
  { match: /gratific|obreiro convidado|pregador/, category: 'Gratificações' },
  { match: /generos alimenticios|alimentacao|alimento/, category: 'Despesas com Eventos' },
  { match: /registro de ata|cartorio/, category: 'Cartório / Registros' }
];

const FALLBACK_EXPENSE_CATEGORY = 'Outras Despesas';

function mapDestinoToCategory(destino: string): string {
  const norm = normalizeName(destino);
  for (const rule of DESTINO_RULES) {
    if (rule.match.test(norm)) return rule.category;
  }
  return FALLBACK_EXPENSE_CATEGORY;
}

function mapForma(forma: string): string {
  const norm = normalizeName(forma);
  if (norm.includes('transf')) return 'Transferência Bancária';
  return 'Dinheiro';
}

// --- member matching ---
type AttenderMatch =
  | { kind: 'exact'; attenderId: number; matchedName: string }
  | { kind: 'fuzzy'; attenderId: number; matchedName: string; reason: string }
  | { kind: 'none' };

function buildAttenderMatcher(attenderRows: { id: number; name: string }[]) {
  const byNorm = new Map<string, { id: number; name: string }>();
  for (const m of attenderRows) {
    const n = normalizeName(m.name);
    if (n) byNorm.set(n, m);
  }
  const allNormed = [...byNorm.entries()].map(([n, m]) => ({ norm: n, attender: m }));

  return function match(legacyName: string | null | undefined): AttenderMatch {
    if (!legacyName) return { kind: 'none' };
    const norm = normalizeName(legacyName);
    if (!norm) return { kind: 'none' };

    const exact = byNorm.get(norm);
    if (exact) return { kind: 'exact', attenderId: exact.id, matchedName: exact.name };

    // Skip strings that obviously aren't a person's name.
    if (
      /anonim|rendimento|cofre|poupanca|abertura|venda|familia|partilhamento|igreja|terenos|pulpito/.test(
        norm
      )
    ) {
      return { kind: 'none' };
    }

    // Token-subset: all 2+ tokens of legacy name must appear as tokens in an attender's name; needs to be unambiguous.
    const legacyTokens = norm.split(' ').filter((t) => t.length >= 2);
    if (legacyTokens.length >= 2) {
      const subsetMatches = allNormed.filter(({ norm: attenderNorm }) => {
        const attenderTokens = new Set(attenderNorm.split(' '));
        return legacyTokens.every((t) => attenderTokens.has(t));
      });
      if (subsetMatches.length === 1) {
        const a = subsetMatches[0].attender;
        return { kind: 'fuzzy', attenderId: a.id, matchedName: a.name, reason: 'token-subset' };
      }
    }

    // Levenshtein fallback — ≤ 2 (≤ 1 for short strings), unambiguous winner only.
    const maxDist = norm.length <= 8 ? 1 : 2;
    const close = allNormed
      .map((e) => ({ ...e, dist: levenshtein(norm, e.norm) }))
      .filter((e) => e.dist <= maxDist)
      .sort((a, b) => a.dist - b.dist);
    if (close.length === 1 || (close.length > 1 && close[0].dist < close[1].dist)) {
      return {
        kind: 'fuzzy',
        attenderId: close[0].attender.id,
        matchedName: close[0].attender.name,
        reason: `levenshtein=${close[0].dist}`
      };
    }
    return { kind: 'none' };
  };
}

function lookupMatch(
  name: string | null | undefined,
  cache: Map<string, AttenderMatch>,
  matcher: (name: string | null | undefined) => AttenderMatch
): AttenderMatch {
  const key = name ?? '';
  const cached = cache.get(key);
  if (cached) return cached;
  const result = matcher(name);
  cache.set(key, result);
  return result;
}

function noteForMatch(legacyName: string | null, match: AttenderMatch): string | null {
  if (match.kind === 'fuzzy') {
    return `[REVISAR] Vínculo automático (${match.reason}): nome legado "${legacyName ?? ''}" → "${match.matchedName}"`;
  }
  if (match.kind === 'none' && legacyName) {
    const norm = normalizeName(legacyName);
    if (norm.length < 3) return null;
    if (
      /anonim|rendimento|cofre|poupanca|abertura|venda|familia|partilhamento|igreja|terenos|pulpito/.test(
        norm
      )
    ) {
      return null;
    }
    return `[REVISAR] Nome legado não vinculado: "${legacyName}"`;
  }
  return null;
}

type IncomeRow = typeof incomeEntries.$inferInsert;
type ExpenseRow = typeof expenseEntries.$inferInsert;

function buildIncomeRows(
  entradas: LegacyEntrada[],
  pmByName: Record<string, { id: number }>,
  matchAttender: (name: string | null | undefined) => AttenderMatch,
  icByName: Record<string, { id: number }>,
  dfByName: Record<string, { id: number }>,
  tesoureiroId: number
): { rows: IncomeRow[]; skippedBadDate: number } {
  const matchCache = new Map<string, AttenderMatch>();
  const rows: IncomeRow[] = [];
  let skippedBadDate = 0;

  for (const e of entradas) {
    const refDate = repairDate(clean(e.data_referencia));
    const depDate = repairDate(clean(e.data_deposito)) ?? refDate;
    if (!isValidDate(refDate)) {
      skippedBadDate++;
      continue;
    }
    const paymentMethodId = pmByName[mapForma(e.forma_pagamento)].id;
    const match = lookupMatch(e.nome, matchCache, matchAttender);
    const attenderId = match.kind === 'none' ? null : match.attenderId;
    const baseNote = noteForMatch(e.nome, match);

    const dizimo = parseAmount(e.dizimo);
    const terenos = parseAmount(e.doacao_terenos);
    const missoes = parseAmount(e.doacao_missoes);
    const pam = parseAmount(e.doacao_pam);
    const campanha = parseAmount(e.doacao_campanha);
    const campanhaName = clean(e.campanha_nome);

    const common = {
      referenceDate: refDate!,
      depositDate: isValidDate(depDate) ? depDate! : refDate!,
      attenderId,
      paymentMethodId,
      status: 'paga' as const,
      userId: tesoureiroId
    };

    if (dizimo > 0) {
      rows.push({
        ...common,
        amount: fmtMoney(dizimo),
        categoryId: icByName['Dízimo'].id,
        notes: baseNote
      });
    }
    if (terenos > 0) {
      rows.push({
        ...common,
        amount: fmtMoney(terenos),
        categoryId: icByName['Doação'].id,
        designatedFundId: dfByName['Terenos'].id,
        notes: baseNote
      });
    }
    if (missoes > 0) {
      rows.push({
        ...common,
        amount: fmtMoney(missoes),
        categoryId: icByName['Oferta Missionária'].id,
        designatedFundId: dfByName['Fundo Missionário'].id,
        notes: baseNote
      });
    }
    if (pam > 0) {
      rows.push({
        ...common,
        amount: fmtMoney(pam),
        categoryId: icByName['Oferta Missionária'].id,
        designatedFundId: dfByName['PAM'].id,
        notes: baseNote
      });
    }
    if (campanha > 0) {
      const campNote = [baseNote, campanhaName ? `Campanha: "${campanhaName}"` : null]
        .filter(Boolean)
        .join(' | ');
      rows.push({
        ...common,
        amount: fmtMoney(campanha),
        categoryId: icByName['Eventos / Campanhas'].id,
        designatedFundId: dfByName['Campanhas'].id,
        notes: campNote || null
      });
    }
  }

  return { rows, skippedBadDate };
}

function buildExpenseRows(
  saidas: LegacySaida[],
  ecByName: Record<string, { id: number }>,
  pmByName: Record<string, { id: number }>,
  tesoureiroId: number
): { rows: ExpenseRow[]; unmappedDestinoCounts: Map<string, number>; skippedBadDate: number } {
  const rows: ExpenseRow[] = [];
  const unmappedDestinoCounts = new Map<string, number>();
  let skippedBadDate = 0;

  for (const s of saidas) {
    const refDate = repairDate(clean(s.data));
    const destino = clean(s.destino);
    if (!isValidDate(refDate)) {
      skippedBadDate++;
      continue;
    }
    if (!destino || !(s.valor > 0)) continue;
    const categoryName = mapDestinoToCategory(destino);
    if (categoryName === FALLBACK_EXPENSE_CATEGORY) {
      unmappedDestinoCounts.set(destino, (unmappedDestinoCounts.get(destino) ?? 0) + 1);
    }
    const category = ecByName[categoryName];
    const amount = fmtMoney(s.valor);
    const description = destino.length > 256 ? destino.slice(0, 256) : destino;
    const notes =
      categoryName === FALLBACK_EXPENSE_CATEGORY
        ? `[REVISAR] Destino legado não mapeado: "${destino}"`
        : null;
    rows.push({
      referenceDate: refDate!,
      description,
      total: amount,
      amount,
      categoryId: category.id,
      paymentMethodId: pmByName['Transferência Bancária'].id,
      status: 'paga',
      userId: tesoureiroId,
      notes
    });
  }

  return { rows, unmappedDestinoCounts, skippedBadDate };
}

export async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed must not run in production');
  }

  console.log('Seeding database (with real legacy financial data)...');
  const legacy = readLegacy();
  if (legacy.membros.length || legacy.entradas.length || legacy.saidas.length) {
    console.log(`Reading legacy SQLite from: ${LEGACY_SQLITE_PATH}`);
    console.log(
      `Legacy: ${legacy.membros.length} members, ${legacy.entradas.length} income, ${legacy.saidas.length} expense rows.`
    );
  } else {
    console.log(`Legacy SQLite not found at ${LEGACY_SQLITE_PATH} — seeding structural data only.`);
  }

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

    // --- Roles ---
    const insertedRoles = await tx.insert(roles).values(SEED_ROLES).returning();
    const roleByName = Object.fromEntries(insertedRoles.map((r) => [r.name, r]));

    // ORDER MATTERS — IDs referenced by packages/shared (Action enum). APPEND ONLY.
    const insertedPerms = await tx.insert(permissions).values(SEED_PERMISSIONS).returning();
    const permByName = Object.fromEntries(insertedPerms.map((p) => [p.name, p]));
    for (let i = 0; i < EXPECTED_PERMISSION_ORDER.length; i++) {
      if (insertedPerms[i]?.name !== EXPECTED_PERMISSION_ORDER[i]) {
        throw new Error(
          'Seed permission order changed — update packages/shared/src/index.ts Action enum to match.'
        );
      }
    }

    // ORDER MATTERS — IDs referenced by packages/shared (Module enum). APPEND ONLY.
    const insertedMods = await tx.insert(modules).values(SEED_MODULES).returning();
    const modByName = Object.fromEntries(insertedMods.map((m) => [m.name, m]));
    for (let i = 0; i < EXPECTED_MODULE_ORDER.length; i++) {
      if (insertedMods[i]?.name !== EXPECTED_MODULE_ORDER[i]) {
        throw new Error(
          `Seed module order changed at index ${i} — update packages/shared/src/index.ts Module enum to match.`
        );
      }
    }

    // --- Users (dev demo accounts) ---
    const insertedUsers = await tx
      .insert(users)
      .values([
        {
          name: 'Administrador da Silva',
          email: 'admin@email.com',
          passwordHash: await hashPassword('admin123'),
          roleId: roleByName['Administrador'].id
        },
        {
          name: 'Presidente da Silva',
          email: 'presidente@email.com',
          passwordHash: await hashPassword('presidente123'),
          roleId: roleByName['Presidente'].id
        },
        {
          name: 'Vice Presidente da Silva',
          email: 'vice.presidente@email.com',
          passwordHash: await hashPassword('vicepres123'),
          roleId: roleByName['Vice-Presidente'].id
        },
        {
          name: 'Tesoureiro Responsável da Silva',
          email: 'tesoureiro.resp@email.com',
          passwordHash: await hashPassword('tesresp123'),
          roleId: roleByName['Tesoureiro Responsável'].id
        },
        {
          name: 'Tesoureiro da Silva',
          email: 'tesoureiro@email.com',
          passwordHash: await hashPassword('tesoureiro123'),
          roleId: roleByName['Tesoureiro'].id
        },
        {
          name: 'Secretário Responsável da Silva',
          email: 'secretario.resp@email.com',
          passwordHash: await hashPassword('secresp123'),
          roleId: roleByName['Secretário Responsável'].id
        },
        {
          name: 'Secretário da Silva',
          email: 'secretario@email.com',
          passwordHash: await hashPassword('secretario123'),
          roleId: roleByName['Secretário'].id
        },
        {
          name: 'Membro da Silva',
          email: 'membro@email.com',
          passwordHash: await hashPassword('membro123'),
          roleId: roleByName['Membro'].id
        }
      ])
      .returning();
    const userByEmail = Object.fromEntries(insertedUsers.map((u) => [u.email, u]));

    // --- Role-Module-Permissions ---
    const rmpRows = buildRoleModulePermissions(
      roleByName,
      modByName,
      permByName,
      insertedMods.map((m) => m.name)
    );
    await tx.insert(roleModulePermissions).values(rmpRows);

    const umpRows = insertedUsers.flatMap((user) =>
      rmpRows
        .filter((rmp) => rmp.roleId === user.roleId)
        .map((rmp) => ({ userId: user.id, moduleId: rmp.moduleId, permissionId: rmp.permissionId }))
    );
    await tx.insert(userModulePermissions).values(umpRows);

    // --- Payment Methods ---
    const insertedPMs = await tx.insert(paymentMethods).values(SEED_PAYMENT_METHODS).returning();
    const pmByName = Object.fromEntries(insertedPMs.map((pm) => [pm.name, pm]));

    // --- Designated Funds ---
    const insertedFunds = await tx
      .insert(designatedFunds)
      .values([
        {
          name: 'Fundo de Obras',
          description: 'Reserva para reformas e melhorias da sede',
          targetAmount: '50000.00'
        },
        {
          name: 'Fundo Missionário',
          description: 'Recursos destinados ao apoio de missionários e seminaristas'
        },
        {
          name: 'Dia das Crianças',
          description: 'Campanha anual para o evento infantil',
          targetAmount: '2000.00'
        },
        { name: 'Terenos', description: 'Apoio à congregação irmã em Terenos/MS' },
        { name: 'PAM', description: 'Plano de Auxílio Missionário' },
        {
          name: 'Campanhas',
          description: 'Catch-all para ofertas de campanhas históricas migradas do sistema legado'
        }
      ])
      .returning();
    const dfByName = Object.fromEntries(insertedFunds.map((f) => [f.name, f]));

    // --- Income Categories ---
    const insertedICParents = await tx
      .insert(incomeCategories)
      .values(SEED_INCOME_CATEGORY_PARENTS.map((name) => ({ name })))
      .returning();
    const icParentByName = Object.fromEntries(insertedICParents.map((c) => [c.name, c]));
    const insertedICs = await tx
      .insert(incomeCategories)
      .values(buildIncomeCategoryChildren(icParentByName))
      .returning();
    const icByName = Object.fromEntries(insertedICs.map((c) => [c.name, c]));

    // --- Expense Categories (extended to cover real-data destinos) ---
    const insertedECParents = await tx
      .insert(expenseCategories)
      .values([
        ...SEED_EXPENSE_CATEGORY_PARENTS,
        { name: 'Missões' },
        { name: 'Contribuições Eclesiásticas' },
        { name: 'Auxílios' },
        { name: 'Diversos' }
      ])
      .returning();
    const ecParentByName = Object.fromEntries(insertedECParents.map((c) => [c.name, c]));

    const insertedECs = await tx
      .insert(expenseCategories)
      .values([
        ...buildExpenseCategoryChildren(ecParentByName),
        { name: 'Material de Expediente', parentId: ecParentByName['Operacional'].id },
        { name: 'Contador', parentId: ecParentByName['Operacional'].id },
        { name: 'Material Didático', parentId: ecParentByName['Eventos / Programas'].id },
        { name: 'Gratificações', parentId: ecParentByName['Eventos / Programas'].id },
        { name: 'Cartório / Registros', parentId: ecParentByName['Eventos / Programas'].id },
        { name: 'Missões Nacionais', parentId: ecParentByName['Missões'].id },
        { name: 'Missões Mundiais', parentId: ecParentByName['Missões'].id },
        { name: 'PAM', parentId: ecParentByName['Missões'].id },
        { name: 'Auxílio a Seminarista', parentId: ecParentByName['Missões'].id },
        { name: 'Auxílio a Pastor em Formação', parentId: ecParentByName['Missões'].id },
        { name: 'Plano Cooperativo', parentId: ecParentByName['Contribuições Eclesiásticas'].id },
        { name: 'Acibams', parentId: ecParentByName['Contribuições Eclesiásticas'].id },
        { name: 'Auxílio Combustível', parentId: ecParentByName['Auxílios'].id },
        { name: FALLBACK_EXPENSE_CATEGORY, parentId: ecParentByName['Diversos'].id }
      ])
      .returning();
    const ecByName = Object.fromEntries(insertedECs.map((c) => [c.name, c]));

    // --- Finance Settings ---
    await tx.insert(financeSettings).values({ openingBalance: '0.00' });

    // --- Church Settings (singleton) ---
    await tx.insert(churchSettings).values({
      id: 1,
      name: 'Igreja Batista Nova Jerusalém',
      cnpj: '15.556.152/0001-42',
      addressStreet: 'Rua Santo Amaro',
      addressNumber: '286',
      addressDistrict: 'Vila Carrão',
      addressCity: 'São Paulo',
      addressState: 'SP',
      postalCode: '03446000',
      phone: '(11) 2741-4262',
      email: null,
      websiteUrl: null,
      currentPresidentName: 'Pr. Deucir Araújo de Almeida',
      currentPresidentTitle: 'Presidente',
      currentSecretaryName: 'Secretário Responsável da Silva',
      currentSecretaryTitle: '1º Secretário(a)'
    });

    // --- Attenders (legacy + demo) ---
    const legacyAttenderRows = legacy.membros
      .map((m) => {
        const name = clean(m.nome);
        if (!name) return null;
        return {
          name,
          birthDate: cleanBirthDate(clean(m.data_nascimento)),
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

    const insertedLegacyAttenders = legacyAttenderRows.length
      ? await tx.insert(attenders).values(legacyAttenderRows).returning()
      : [];
    console.log(`Inserted ${insertedLegacyAttenders.length} attenders from legacy DB.`);

    // Demo attender linked to the membro@email.com user for the link-flow demo.
    const insertedDemoAttenders = await tx
      .insert(attenders)
      .values([
        {
          name: 'João da Silva',
          userId: userByEmail['membro@email.com'].id,
          birthDate: '1985-05-15',
          addressStreet: 'Rua das Flores',
          addressNumber: 123,
          addressComplement: 'Apto 45',
          addressDistrict: 'Centro',
          state: 'SP',
          city: 'São Paulo',
          postalCode: '01001000',
          email: 'joao.silva@email.com',
          phone: '11987654321',
          isMember: true,
          memberSince: '2010-04-18',
          congregatingSinceYear: 2008,
          admissionMode: 'aclamação' as const
        }
      ])
      .returning();

    const allAttenders = [...insertedLegacyAttenders, ...insertedDemoAttenders];
    const matchAttender = buildAttenderMatcher(allAttenders);

    // --- Income Entries (from legacy entradas) ---
    const tesoureiroId = userByEmail['tesoureiro@email.com'].id;

    const { rows: incomeRows, skippedBadDate } = buildIncomeRows(
      legacy.entradas,
      pmByName,
      matchAttender,
      icByName,
      dfByName,
      tesoureiroId
    );

    const BATCH = 500;
    for (let i = 0; i < incomeRows.length; i += BATCH) {
      await tx.insert(incomeEntries).values(incomeRows.slice(i, i + BATCH));
    }
    const incomeLogMsg = skippedBadDate ? ` Skipped ${skippedBadDate} rows with bad dates.` : '';
    console.log(`Inserted ${incomeRows.length} income entries.${incomeLogMsg}`);

    // --- Expense Entries (from legacy saidas) ---
    const {
      rows: expenseRows,
      unmappedDestinoCounts,
      skippedBadDate: skippedExpBadDate
    } = buildExpenseRows(legacy.saidas, ecByName, pmByName, tesoureiroId);

    for (let i = 0; i < expenseRows.length; i += BATCH) {
      await tx.insert(expenseEntries).values(expenseRows.slice(i, i + BATCH));
    }
    const expenseLogMsg = skippedExpBadDate
      ? ` Skipped ${skippedExpBadDate} rows with bad dates.`
      : '';
    console.log(`Inserted ${expenseRows.length} expense entries.${expenseLogMsg}`);
    if (unmappedDestinoCounts.size > 0) {
      const top = [...unmappedDestinoCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([d, c]) => `  ${c}× "${d}"`)
        .join('\n');
      const unmappedMsg = `${unmappedDestinoCounts.size} distinct destinos fell through to "${FALLBACK_EXPENSE_CATEGORY}". Top 10:\n${top}`;
      console.log(unmappedMsg);
    }

    // --- Board Meetings + Minutes (demo data) ---
    const adminId = userByEmail['admin@email.com'].id;
    const secResp = userByEmail['secretario.resp@email.com'];

    const insertedMeetings = await tx
      .insert(meetings)
      .values([
        {
          meetingDate: '2023-03-12',
          type: SEED_MEETING_TYPES.Ordinary
        },
        {
          meetingDate: '2023-11-12',
          type: SEED_MEETING_TYPES.Extraordinary
        },
        {
          meetingDate: '2025-02-15',
          type: SEED_MEETING_TYPES.Ordinary
        },
        {
          meetingDate: '2025-04-26',
          type: SEED_MEETING_TYPES.Ordinary
        }
      ])
      .returning();
    const meetingByDate = Object.fromEntries(insertedMeetings.map((m) => [m.meetingDate, m]));

    // --- Agenda Items (extracted from meetings) ---
    const agendaItemsByMeetingDate: Record<string, string[]> = {
      '2023-03-12': [
        'Oração inicial',
        'Leitura e aprovação da Ata anterior (Nº 718)',
        'Apresentação do Relatório Financeiro (Janeiro e Fevereiro 2023)',
        'Deliberação sobre o apoio a seminaristas',
        'Oração de encerramento'
      ],
      '2023-11-12': ['Eleição e posse da diretoria para o exercício de 2024.'],
      '2025-02-15': [
        'Leitura e aprovação das atas anteriores',
        'Leitura e aprovação do Relatório Financeiro',
        'Movimento de Membros: Saída — Promovido para a Nova Jerusalém Celestial irmão Paulo Rodrigues de Oliveira, dia 30/01/2025',
        'Metas Ministeriais e Estruturais para 2025',
        'Apresentação do Orçamento Anual 2025'
      ],
      '2025-04-26': ['Assuntos gerais e planejamento do retiro de Páscoa.']
    };

    const agendaItemRows = Object.entries(agendaItemsByMeetingDate).flatMap(([date, titles]) =>
      titles.map((title, idx) => ({
        meetingId: meetingByDate[date].id,
        order: idx,
        title,
        createdByUserId: adminId
      }))
    );
    await tx.insert(agendaItems).values(agendaItemRows);

    const [minute719] = await tx
      .insert(minutes)
      .values({ meetingId: meetingByDate['2023-03-12'].id, minuteNumber: '719' })
      .returning();
    await tx.insert(minuteVersions).values({
      minuteId: minute719.id,
      version: 1,
      status: 'aprovada' as const,
      reasonForChange: 'Criação inicial da ata.',
      createdByUserId: secResp.id,
      approvedAtMeetingId: meetingByDate['2023-03-12'].id,
      content: {
        text: '<h2>Ata de número 719</h2><p>No dia 12 de março de 2023, às 17:10hs, o Pastor Deucir Araújo de Almeida, declarou aberta a assembleia. Foi lida e aprovada a Ata de nº 718. Foi lido o Relatório Financeiro referente aos meses de janeiro e fevereiro de 2023. Foram aprovados os apoios financeiros aos seminaristas Dárcio Batista Campos e Andrew Cavalheiro Costa Leite, e a continuidade do auxílio a Cristiano Roberto Valente. A assembleia foi encerrada com uma oração.</p>'
      }
    });

    const [minute723] = await tx
      .insert(minutes)
      .values({ meetingId: meetingByDate['2023-11-12'].id, minuteNumber: '723' })
      .returning();
    await tx.insert(minuteVersions).values({
      minuteId: minute723.id,
      version: 1,
      status: 'aprovada' as const,
      reasonForChange: 'Criação inicial da ata.',
      createdByUserId: secResp.id,
      approvedAtMeetingId: meetingByDate['2023-11-12'].id,
      content: {
        text: '<h2>Ata de número 723 — Assembleia Extraordinária</h2><p>Realizada no dia 12 de novembro de 2023, com o propósito de eleger e empossar a diretoria para o exercício administrativo de 2024. A proposta da comissão foi aceita e aprovada por unanimidade. A diretoria eleita tomou posse nesta data. A assembleia foi encerrada às 19:30hs.</p>'
      }
    });

    const [minute725] = await tx
      .insert(minutes)
      .values({ meetingId: meetingByDate['2025-04-26'].id, minuteNumber: '725' })
      .returning();
    await tx.insert(minuteVersions).values([
      {
        minuteId: minute725.id,
        version: 1,
        status: 'aprovada' as const,
        reasonForChange: 'Criação inicial da ata.',
        createdByUserId: secResp.id,
        approvedAtMeetingId: meetingByDate['2025-04-26'].id,
        content: {
          text: '<h2>Ata de número 725 — Versão Original</h2><p>Discussão sobre os preparativos para o Retiro de Páscoa. Foi aprovado o orçamento de R$ 5.000,00 para o evento.</p>'
        }
      },
      {
        minuteId: minute725.id,
        version: 2,
        status: 'aguardando aprovação' as const,
        reasonForChange: 'Correção do valor do orçamento e adição da equipe de louvor.',
        createdByUserId: secResp.id,
        content: {
          text: '<h2>Ata de número 725 — Versão Corrigida</h2><p>Discussão sobre os preparativos para o Retiro de Páscoa. Foi aprovado o orçamento de R$ 5.500,00 para o evento. Foi incluída também a organização de uma equipe de louvor específica para o retiro.</p>'
        }
      }
    ]);

    // --- Minute Templates (default templates for meeting minutes) ---
    await tx.insert(minuteTemplates).values([
      {
        meetingType: SEED_MEETING_TYPES.Ordinary,
        name: 'Modelo Padrão — Assembleia Ordinária',
        isDefault: true,
        createdByUserId: adminId,
        defaultAgendaItems: [
          { title: 'Pauta da Assembleia' },
          { title: 'Leitura da ata anterior' },
          { title: 'Relatório financeiro' },
          {
            title: 'Encerramento',
            description:
              'A assembleia foi encerrada às {{closing_time}}. Eu, {{secretary_name}}, lavrei a presente Ata, assinada por mim e pelo presidente.'
          }
        ],
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: 'Ata de número {{minute_number}}'
                },
                {
                  type: 'text',
                  text: ' da Assembleia Ordinária Bimestral da {{church_name}}, situada na {{church_address}}, no dia {{meeting_date_extenso}}. O Pastor {{presiding_pastor_name}} fez uma reflexão e declarou aberta a Assembleia às {{opening_time}}. '
                },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }, { type: 'underline' }],
                  text: 'Leitura da Ata de nº {{previous_minute_number}}:'
                },
                { type: 'text', text: ' foi lida e aprovada sem ressalva a Ata anterior. ' },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }, { type: 'underline' }],
                  text: 'Relatório Financeiro:'
                },
                { type: 'text', text: ' ' },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }, { type: 'underline' }],
                  text: 'Movimento de membros:'
                },
                { type: 'text', text: ' ' },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }, { type: 'underline' }],
                  text: 'Comunicações:'
                },
                { type: 'text', text: ' ' },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }, { type: 'underline' }],
                  text: 'Pautas:'
                },
                { type: 'text', text: ' {{pautas}} ' }
              ]
            }
          ]
        }
      },
      {
        meetingType: SEED_MEETING_TYPES.Extraordinary,
        name: 'Modelo Padrão — Assembleia Extraordinária',
        isDefault: true,
        createdByUserId: adminId,
        defaultAgendaItems: [
          {
            title: 'Encerramento',
            description:
              'Depois de discutida a pauta do dia, foi feita uma oração. Foi encerrada a Assembleia Extraordinária às {{closing_time}}. Eu, {{secretary_name}}, lavrei a presente Ata, assinada por mim e pelo presidente.'
          }
        ],
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: 'Ata de número {{minute_number}}'
                },
                {
                  type: 'text',
                  text: ' da Assembleia Extraordinária da {{church_name}}, devidamente inscrita no CNPJ sob nº {{church_cnpj}}, situada na {{church_address}}. Realizada no dia {{meeting_date_extenso}}. O presidente, {{presiding_pastor_name}}, deu início à devocional com uma oração. Foi declarada aberta às {{opening_time}}. '
                },
                { type: 'text', marks: [{ type: 'bold' }, { type: 'underline' }], text: 'Pautas:' },
                { type: 'text', text: ' {{pautas}} ' }
              ]
            }
          ]
        }
      }
    ]);
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
