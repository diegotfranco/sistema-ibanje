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
  members,
  incomeEntries,
  expenseEntries,
  boardMeetings,
  minutes,
  minuteVersions,
  financeSettings
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
  const n = typeof v === 'number' ? v : parseFloat(String(v));
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
    return { membros: [] as LegacyMember[], entradas: [] as LegacyEntrada[], saidas: [] as LegacySaida[] };
  }
  const legacy = new DatabaseSync(LEGACY_SQLITE_PATH, { readOnly: true });
  try {
    return {
      membros: legacy.prepare('SELECT * FROM membros').all() as unknown as LegacyMember[],
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
type MemberMatch =
  | { kind: 'exact'; memberId: number; matchedName: string }
  | { kind: 'fuzzy'; memberId: number; matchedName: string; reason: string }
  | { kind: 'none' };

function buildMemberMatcher(memberRows: { id: number; name: string }[]) {
  const byNorm = new Map<string, { id: number; name: string }>();
  for (const m of memberRows) {
    const n = normalizeName(m.name);
    if (n) byNorm.set(n, m);
  }
  const allNormed = [...byNorm.entries()].map(([n, m]) => ({ norm: n, member: m }));

  return function match(legacyName: string | null | undefined): MemberMatch {
    if (!legacyName) return { kind: 'none' };
    const norm = normalizeName(legacyName);
    if (!norm) return { kind: 'none' };

    const exact = byNorm.get(norm);
    if (exact) return { kind: 'exact', memberId: exact.id, matchedName: exact.name };

    // Skip strings that obviously aren't a person's name.
    if (
      /anonim|rendimento|cofre|poupanca|abertura|venda|familia|partilhamento|igreja|terenos|pulpito/.test(
        norm
      )
    ) {
      return { kind: 'none' };
    }

    // Token-subset: all 2+ tokens of legacy name must appear as tokens in a member's name; needs to be unambiguous.
    const legacyTokens = norm.split(' ').filter((t) => t.length >= 2);
    if (legacyTokens.length >= 2) {
      const subsetMatches = allNormed.filter(({ norm: memberNorm }) => {
        const memberTokens = new Set(memberNorm.split(' '));
        return legacyTokens.every((t) => memberTokens.has(t));
      });
      if (subsetMatches.length === 1) {
        const m = subsetMatches[0].member;
        return { kind: 'fuzzy', memberId: m.id, matchedName: m.name, reason: 'token-subset' };
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
        memberId: close[0].member.id,
        matchedName: close[0].member.name,
        reason: `levenshtein=${close[0].dist}`
      };
    }
    return { kind: 'none' };
  };
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
          income_categories, expense_categories, members, income_entries,
          expense_entries, board_meetings, minutes, minute_versions,
          monthly_closings, finance_settings
          RESTART IDENTITY CASCADE`
    );

    // --- Roles ---
    const insertedRoles = await tx
      .insert(roles)
      .values([
        {
          name: 'Administrador',
          description: 'Acesso irrestrito a todas as funcionalidades do sistema para manutenção.'
        },
        {
          name: 'Presidente',
          description: 'Acesso total para gestão administrativa, financeira e de pautas.'
        },
        {
          name: 'Vice-Presidente',
          description: 'Acesso total para gestão, atuando como substituto legal do presidente.'
        },
        {
          name: 'Secretário Responsável',
          description: 'Gestão completa de atas e membros, incluindo remoção de registros.'
        },
        {
          name: 'Secretário',
          description: 'Gestão de atas e membros, sem permissão para remover registros.'
        },
        {
          name: 'Tesoureiro Responsável',
          description: 'Gestão financeira completa, incluindo remoção de lançamentos.'
        },
        {
          name: 'Tesoureiro',
          description: 'Gestão financeira do dia-a-dia, sem permissão para remover lançamentos.'
        },
        {
          name: 'Comissão de Exame de Contas',
          description:
            'Órgão de fiscalização interna responsável por garantir a transparência e a integridade das finanças da igreja'
        },
        {
          name: 'Membro',
          description: 'Acesso de visualização para transparência de atas e dados pessoais.'
        }
      ])
      .returning();
    const roleByName = Object.fromEntries(insertedRoles.map((r) => [r.name, r]));

    // ORDER MATTERS — IDs referenced by packages/shared (Action enum). APPEND ONLY.
    const insertedPerms = await tx
      .insert(permissions)
      .values([
        { name: 'Acessar', description: 'Permite acesso à área do sistema' },
        { name: 'Cadastrar', description: 'Permite adicionar um registro' },
        { name: 'Editar', description: 'Permite editar um registro' },
        { name: 'Remover', description: 'Permite remover um registro' },
        { name: 'Revisar', description: 'Permite revisar e aprovar um registro' },
        { name: 'Relatórios', description: 'Permite gerar relatórios' }
      ])
      .returning();
    const permByName = Object.fromEntries(insertedPerms.map((p) => [p.name, p]));
    if (
      insertedPerms[0].name !== 'Acessar' ||
      insertedPerms[1].name !== 'Cadastrar' ||
      insertedPerms[2].name !== 'Editar' ||
      insertedPerms[3].name !== 'Remover' ||
      insertedPerms[4].name !== 'Revisar' ||
      insertedPerms[5].name !== 'Relatórios'
    ) {
      throw new Error(
        'Seed permission order changed — update packages/shared/src/index.ts Action enum to match.'
      );
    }

    // ORDER MATTERS — IDs referenced by packages/shared (Module enum). APPEND ONLY.
    const insertedMods = await tx
      .insert(modules)
      .values([
        { name: 'Usuários', description: 'Gerencia os usuários do sistema' },
        { name: 'Cargos', description: 'Gerencia os cargos e funções do sistema' },
        { name: 'Permissões', description: 'Gerencia os tipos de permissões disponíveis' },
        { name: 'Áreas', description: 'Gerencia as seções funcionais do sistema' },
        { name: 'Status', description: 'Gerencia os status dos registros do sistema' },
        { name: 'Membros', description: 'Gerencia os membros da igreja' },
        {
          name: 'Categorias de Entradas',
          description: 'Gerencia os tipos de entradas financeiras'
        },
        {
          name: 'Lançamentos de Entradas',
          description: 'Gerencia o registro de entradas financeiras'
        },
        { name: 'Categorias de Saídas', description: 'Gerencia os tipos de saídas financeiras' },
        { name: 'Lançamentos de Saídas', description: 'Gerencia o registro de saídas financeiras' },
        { name: 'Formas de Pagamento', description: 'Gerencia as formas de pagamento disponíveis' },
        { name: 'Fundos Designados', description: 'Gerencia os fundos designados da igreja' },
        { name: 'Painel', description: 'Painel com informações e estatísticas do sistema' },
        {
          name: 'Relatórios',
          description: 'Área destinada à geração de relatórios financeiros e administrativos'
        },
        {
          name: 'Fechamentos Mensais',
          description: 'Gerencia os fechamentos mensais de tesouraria'
        },
        { name: 'Pautas', description: 'Gerencia as pautas das reuniões da diretoria' },
        { name: 'Atas', description: 'Gerencia as atas das reuniões da diretoria' }
      ])
      .returning();
    const modByName = Object.fromEntries(insertedMods.map((m) => [m.name, m]));
    const expectedModuleOrder = [
      'Usuários',
      'Cargos',
      'Permissões',
      'Áreas',
      'Status',
      'Membros',
      'Categorias de Entradas',
      'Lançamentos de Entradas',
      'Categorias de Saídas',
      'Lançamentos de Saídas',
      'Formas de Pagamento',
      'Fundos Designados',
      'Painel',
      'Relatórios',
      'Fechamentos Mensais',
      'Pautas',
      'Atas'
    ];
    for (let i = 0; i < expectedModuleOrder.length; i++) {
      if (insertedMods[i]?.name !== expectedModuleOrder[i]) {
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
    function cross(roleId: number, moduleNames: string[], permIds: number[]) {
      return moduleNames.flatMap((mod) =>
        permIds.map((permId) => ({ roleId, moduleId: modByName[mod].id, permissionId: permId }))
      );
    }
    const allPermIds = insertedPerms.map((p) => p.id);
    const fullPermIds = ['Acessar', 'Cadastrar', 'Editar', 'Remover', 'Relatórios'].map(
      (n) => permByName[n].id
    );
    const writePermIds = ['Acessar', 'Cadastrar', 'Editar', 'Relatórios'].map(
      (n) => permByName[n].id
    );
    const readPermIds = ['Acessar', 'Relatórios'].map((n) => permByName[n].id);
    const financialMods = [
      'Categorias de Entradas',
      'Lançamentos de Entradas',
      'Categorias de Saídas',
      'Lançamentos de Saídas',
      'Formas de Pagamento',
      'Fundos Designados'
    ];
    const adminMods = ['Painel', 'Membros', 'Atas'];

    const rmpRows = [
      ...cross(
        roleByName['Administrador'].id,
        insertedMods.map((m) => m.name),
        allPermIds
      ),
      ...cross(roleByName['Tesoureiro'].id, ['Painel', ...financialMods], writePermIds),
      ...cross(roleByName['Tesoureiro'].id, ['Membros', 'Atas'], readPermIds),
      ...cross(
        roleByName['Comissão de Exame de Contas'].id,
        ['Painel', ...financialMods],
        readPermIds
      ),
      ...cross(roleByName['Tesoureiro Responsável'].id, ['Painel', ...financialMods], fullPermIds),
      ...cross(roleByName['Tesoureiro Responsável'].id, ['Membros', 'Atas'], readPermIds),
      ...cross(roleByName['Secretário'].id, adminMods, writePermIds),
      ...cross(roleByName['Secretário'].id, financialMods, readPermIds),
      ...cross(roleByName['Secretário Responsável'].id, adminMods, fullPermIds),
      ...cross(roleByName['Secretário Responsável'].id, financialMods, readPermIds),
      ...cross(roleByName['Presidente'].id, financialMods, fullPermIds),
      ...cross(roleByName['Presidente'].id, adminMods, fullPermIds),
      ...cross(roleByName['Presidente'].id, ['Pautas'], allPermIds),
      ...cross(roleByName['Vice-Presidente'].id, financialMods, fullPermIds),
      ...cross(roleByName['Vice-Presidente'].id, adminMods, fullPermIds),
      ...cross(roleByName['Vice-Presidente'].id, ['Pautas'], allPermIds),
      ...cross(
        roleByName['Tesoureiro'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar'].map((n) => permByName[n].id)
      ),
      ...cross(
        roleByName['Tesoureiro Responsável'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map((n) => permByName[n].id)
      ),
      ...cross(
        roleByName['Presidente'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map((n) => permByName[n].id)
      ),
      ...cross(
        roleByName['Vice-Presidente'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map((n) => permByName[n].id)
      ),
      ...cross(
        roleByName['Comissão de Exame de Contas'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Revisar'].map((n) => permByName[n].id)
      ),
      ...cross(roleByName['Membro'].id, ['Atas', 'Membros'], [permByName['Acessar'].id])
    ];
    await tx.insert(roleModulePermissions).values(rmpRows);

    const umpRows = insertedUsers.flatMap((user) =>
      rmpRows
        .filter((rmp) => rmp.roleId === user.roleId)
        .map((rmp) => ({ userId: user.id, moduleId: rmp.moduleId, permissionId: rmp.permissionId }))
    );
    await tx.insert(userModulePermissions).values(umpRows);

    // --- Payment Methods ---
    const insertedPMs = await tx
      .insert(paymentMethods)
      .values([
        { name: 'Dinheiro', allowsInflow: true, allowsOutflow: true },
        { name: 'Transferência Bancária', allowsInflow: true, allowsOutflow: true },
        { name: 'Cartão de Débito', allowsInflow: true, allowsOutflow: true },
        { name: 'Cartão de Crédito', allowsInflow: false, allowsOutflow: true },
        { name: 'Boleto Bancário', allowsInflow: false, allowsOutflow: true }
      ])
      .returning();
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
    const [icContribuicoes, icOutrasReceitas] = await tx
      .insert(incomeCategories)
      .values([{ name: 'Contribuições' }, { name: 'Outras Receitas' }])
      .returning();
    const insertedICs = await tx
      .insert(incomeCategories)
      .values([
        { name: 'Dízimo', parentId: icContribuicoes.id, requiresMember: true },
        { name: 'Oferta de Culto', parentId: icContribuicoes.id },
        { name: 'Oferta Missionária', parentId: icContribuicoes.id },
        { name: 'Doação', parentId: icContribuicoes.id },
        { name: 'Rendimentos Financeiros', parentId: icOutrasReceitas.id },
        { name: 'Eventos / Campanhas', parentId: icOutrasReceitas.id }
      ])
      .returning();
    const icByName = Object.fromEntries(insertedICs.map((c) => [c.name, c]));

    // --- Expense Categories (extended to cover real-data destinos) ---
    const [
      ecPessoal,
      ecOperacional,
      ecManutencao,
      ecEquipamentos,
      ecEventos,
      ecMissoes,
      ecContribuicoes,
      ecAuxilios,
      ecDiversos
    ] = await tx
      .insert(expenseCategories)
      .values([
        { name: 'Pessoal' },
        { name: 'Operacional' },
        { name: 'Manutenção' },
        { name: 'Equipamentos' },
        { name: 'Eventos / Programas' },
        { name: 'Missões' },
        { name: 'Contribuições Eclesiásticas' },
        { name: 'Auxílios' },
        { name: 'Diversos' }
      ])
      .returning();

    const insertedECs = await tx
      .insert(expenseCategories)
      .values([
        { name: 'Honorários Pastorais', parentId: ecPessoal.id },
        { name: 'FGTM', parentId: ecPessoal.id },
        { name: 'Encargos', parentId: ecPessoal.id },
        { name: 'Água', parentId: ecOperacional.id },
        { name: 'Energia', parentId: ecOperacional.id },
        { name: 'Internet / Telefone', parentId: ecOperacional.id },
        { name: 'Vigilância Patrimonial', parentId: ecOperacional.id },
        { name: 'Tarifa Bancária', parentId: ecOperacional.id },
        { name: 'Material de Limpeza', parentId: ecOperacional.id },
        { name: 'Material de Expediente', parentId: ecOperacional.id },
        { name: 'Contador', parentId: ecOperacional.id },
        { name: 'Manutenção Predial', parentId: ecManutencao.id },
        { name: 'Reparo Hidráulico', parentId: ecManutencao.id },
        { name: 'Reparo Elétrico', parentId: ecManutencao.id },
        { name: 'Compra de Equipamentos', parentId: ecEquipamentos.id },
        { name: 'Despesas com Eventos', parentId: ecEventos.id },
        { name: 'Material Didático', parentId: ecEventos.id },
        { name: 'Gratificações', parentId: ecEventos.id },
        { name: 'Cartório / Registros', parentId: ecEventos.id },
        { name: 'Missões Nacionais', parentId: ecMissoes.id },
        { name: 'Missões Mundiais', parentId: ecMissoes.id },
        { name: 'PAM', parentId: ecMissoes.id },
        { name: 'Auxílio a Seminarista', parentId: ecMissoes.id },
        { name: 'Auxílio a Pastor em Formação', parentId: ecMissoes.id },
        { name: 'Plano Cooperativo', parentId: ecContribuicoes.id },
        { name: 'Acibams', parentId: ecContribuicoes.id },
        { name: 'Auxílio Combustível', parentId: ecAuxilios.id },
        { name: FALLBACK_EXPENSE_CATEGORY, parentId: ecDiversos.id }
      ])
      .returning();
    const ecByName = Object.fromEntries(insertedECs.map((c) => [c.name, c]));

    // --- Finance Settings ---
    await tx.insert(financeSettings).values({ openingBalance: '0.00' });

    // --- Members (legacy + demo) ---
    const legacyMemberRows = legacy.membros
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

    const insertedLegacyMembers = legacyMemberRows.length
      ? await tx.insert(members).values(legacyMemberRows).returning()
      : [];
    console.log(`Inserted ${insertedLegacyMembers.length} members from legacy DB.`);

    // Demo member linked to the membro@email.com user for the link-flow demo.
    const insertedDemoMembers = await tx
      .insert(members)
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
          phone: '11987654321'
        }
      ])
      .returning();

    const allMembers = [...insertedLegacyMembers, ...insertedDemoMembers];
    const matchMember = buildMemberMatcher(allMembers);

    // --- Income Entries (from legacy entradas) ---
    const tesoureiroId = userByEmail['tesoureiro@email.com'].id;

    const matchCache = new Map<string, MemberMatch>();
    function lookupMatch(name: string | null | undefined): MemberMatch {
      const key = name ?? '';
      const cached = matchCache.get(key);
      if (cached) return cached;
      const result = matchMember(name);
      matchCache.set(key, result);
      return result;
    }

    function noteForMatch(legacyName: string | null, match: MemberMatch): string | null {
      if (match.kind === 'fuzzy') {
        return `[REVISAR] Vínculo automático (${match.reason}): nome legado "${legacyName ?? ''}" → "${match.matchedName}"`;
      }
      if (match.kind === 'none' && legacyName) {
        const norm = normalizeName(legacyName);
        if (norm.length < 3) return null;
        // Don't flag obvious non-person tokens — those are intentional unlinked.
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
    const incomeRows: IncomeRow[] = [];
    let skippedBadDate = 0;

    for (const e of legacy.entradas) {
      const refDate = repairDate(clean(e.data_referencia));
      const depDate = repairDate(clean(e.data_deposito)) ?? refDate;
      if (!isValidDate(refDate)) {
        skippedBadDate++;
        continue;
      }
      const paymentMethodId = pmByName[mapForma(e.forma_pagamento)].id;
      const match = lookupMatch(e.nome);
      const memberId = match.kind === 'none' ? null : match.memberId;
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
        memberId,
        paymentMethodId,
        status: 'paga' as const,
        userId: tesoureiroId
      };

      if (dizimo > 0) {
        incomeRows.push({
          ...common,
          amount: fmtMoney(dizimo),
          categoryId: icByName['Dízimo'].id,
          notes: baseNote
        });
      }
      if (terenos > 0) {
        incomeRows.push({
          ...common,
          amount: fmtMoney(terenos),
          categoryId: icByName['Doação'].id,
          designatedFundId: dfByName['Terenos'].id,
          notes: baseNote
        });
      }
      if (missoes > 0) {
        incomeRows.push({
          ...common,
          amount: fmtMoney(missoes),
          categoryId: icByName['Oferta Missionária'].id,
          designatedFundId: dfByName['Fundo Missionário'].id,
          notes: baseNote
        });
      }
      if (pam > 0) {
        incomeRows.push({
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
        incomeRows.push({
          ...common,
          amount: fmtMoney(campanha),
          categoryId: icByName['Eventos / Campanhas'].id,
          designatedFundId: dfByName['Campanhas'].id,
          notes: campNote || null
        });
      }
    }

    const BATCH = 500;
    for (let i = 0; i < incomeRows.length; i += BATCH) {
      await tx.insert(incomeEntries).values(incomeRows.slice(i, i + BATCH));
    }
    console.log(
      `Inserted ${incomeRows.length} income entries.${skippedBadDate ? ` Skipped ${skippedBadDate} rows with bad dates.` : ''}`
    );

    // --- Expense Entries (from legacy saidas) ---
    type ExpenseRow = typeof expenseEntries.$inferInsert;
    const expenseRows: ExpenseRow[] = [];
    const unmappedDestinoCounts = new Map<string, number>();
    let skippedExpBadDate = 0;

    for (const s of legacy.saidas) {
      const refDate = repairDate(clean(s.data));
      const destino = clean(s.destino);
      if (!isValidDate(refDate)) {
        skippedExpBadDate++;
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
      expenseRows.push({
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

    for (let i = 0; i < expenseRows.length; i += BATCH) {
      await tx.insert(expenseEntries).values(expenseRows.slice(i, i + BATCH));
    }
    console.log(
      `Inserted ${expenseRows.length} expense entries.${skippedExpBadDate ? ` Skipped ${skippedExpBadDate} rows with bad dates.` : ''}`
    );
    if (unmappedDestinoCounts.size > 0) {
      const top = [...unmappedDestinoCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([d, c]) => `  ${c}× "${d}"`)
        .join('\n');
      console.log(
        `${unmappedDestinoCounts.size} distinct destinos fell through to "${FALLBACK_EXPENSE_CATEGORY}". Top 10:\n${top}`
      );
    }

    // --- Board Meetings + Minutes (demo data) ---
    const adminId = userByEmail['admin@email.com'].id;
    const secResp = userByEmail['secretario.resp@email.com'];

    const insertedMeetings = await tx
      .insert(boardMeetings)
      .values([
        {
          meetingDate: '2023-03-12',
          type: 'ordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2023-03-01T10:00:00Z'),
          agendaContent: [
            'Oração inicial',
            'Leitura e aprovação da Ata anterior (Nº 718)',
            'Apresentação do Relatório Financeiro (Janeiro e Fevereiro 2023)',
            'Deliberação sobre o apoio a seminaristas',
            'Oração de encerramento'
          ]
        },
        {
          meetingDate: '2023-11-12',
          type: 'extraordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2023-11-01T14:00:00Z'),
          agendaContent: ['Eleição e posse da diretoria para o exercício de 2024.']
        },
        {
          meetingDate: '2025-02-15',
          type: 'ordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2025-02-05T09:00:00Z'),
          agendaContent: [
            'Leitura e aprovação das atas anteriores',
            'Leitura e aprovação do Relatório Financeiro',
            'Movimento de Membros: Saída — Promovido para a Nova Jerusalém Celestial irmão Paulo Rodrigues de Oliveira, dia 30/01/2025',
            'Metas Ministeriais e Estruturais para 2025',
            'Apresentação do Orçamento Anual 2025'
          ]
        },
        {
          meetingDate: '2025-04-26',
          type: 'ordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2025-04-15T11:00:00Z'),
          agendaContent: ['Assuntos gerais e planejamento do retiro de Páscoa.']
        }
      ])
      .returning();
    const meetingByDate = Object.fromEntries(insertedMeetings.map((m) => [m.meetingDate, m]));

    const [minute719] = await tx
      .insert(minutes)
      .values({ boardMeetingId: meetingByDate['2023-03-12'].id, minuteNumber: '719' })
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
      .values({ boardMeetingId: meetingByDate['2023-11-12'].id, minuteNumber: '723' })
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
      .values({ boardMeetingId: meetingByDate['2025-04-26'].id, minuteNumber: '725' })
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
  });

  console.log('Seeding complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => sql.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
