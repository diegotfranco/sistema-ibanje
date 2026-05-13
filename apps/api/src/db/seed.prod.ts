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

    // ORDER MATTERS — this insert order assigns IDs that are referenced as numeric
    // constants by packages/shared/src/index.ts (Action enum). APPEND ONLY.
    // --- Permissions ---
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

    // ORDER MATTERS — this insert order assigns IDs that are referenced as numeric
    // constants by packages/shared/src/index.ts (Module enum). APPEND ONLY.
    // --- Modules ---
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

    const rmpRows = [
      // Administrador: all modules × all permissions
      ...cross(
        roleByName['Administrador'].id,
        insertedMods.map((m) => m.name),
        allPermIds
      ),

      // Tesoureiro: financial (panel included) write, admin (no panel) read
      ...cross(
        roleByName['Tesoureiro'].id,
        [
          'Painel',
          'Categorias de Entradas',
          'Lançamentos de Entradas',
          'Categorias de Saídas',
          'Lançamentos de Saídas',
          'Formas de Pagamento',
          'Fundos Designados'
        ],
        writePermIds
      ),
      ...cross(roleByName['Tesoureiro'].id, ['Membros', 'Atas'], readPermIds),

      // Comissão de Exame de Contas: financial — read
      ...cross(
        roleByName['Comissão de Exame de Contas'].id,
        [
          'Painel',
          'Categorias de Entradas',
          'Lançamentos de Entradas',
          'Categorias de Saídas',
          'Lançamentos de Saídas',
          'Formas de Pagamento',
          'Fundos Designados'
        ],
        readPermIds
      ),

      // Tesoureiro Responsável: financial (panel included) full, admin (no panel) read
      ...cross(
        roleByName['Tesoureiro Responsável'].id,
        [
          'Painel',
          'Categorias de Entradas',
          'Lançamentos de Entradas',
          'Categorias de Saídas',
          'Lançamentos de Saídas',
          'Formas de Pagamento',
          'Fundos Designados'
        ],
        fullPermIds
      ),
      ...cross(roleByName['Tesoureiro Responsável'].id, ['Membros', 'Atas'], readPermIds),

      // Secretário: admin (panel included) write, financial (no panel) read
      ...cross(roleByName['Secretário'].id, ['Painel', 'Membros', 'Atas'], writePermIds),
      ...cross(
        roleByName['Secretário'].id,
        [
          'Categorias de Entradas',
          'Lançamentos de Entradas',
          'Categorias de Saídas',
          'Lançamentos de Saídas',
          'Formas de Pagamento',
          'Fundos Designados'
        ],
        readPermIds
      ),

      // Secretário Responsável: admin (panel included) full, financial (no panel) read
      ...cross(roleByName['Secretário Responsável'].id, ['Painel', 'Membros', 'Atas'], fullPermIds),
      ...cross(
        roleByName['Secretário Responsável'].id,
        [
          'Categorias de Entradas',
          'Lançamentos de Entradas',
          'Categorias de Saídas',
          'Lançamentos de Saídas',
          'Formas de Pagamento',
          'Fundos Designados'
        ],
        readPermIds
      ),

      // Presidente: financial (no panel) full, admin (panel included) full, Pautas full
      ...cross(
        roleByName['Presidente'].id,
        [
          'Categorias de Entradas',
          'Lançamentos de Entradas',
          'Categorias de Saídas',
          'Lançamentos de Saídas',
          'Formas de Pagamento',
          'Fundos Designados'
        ],
        fullPermIds
      ),
      ...cross(roleByName['Presidente'].id, ['Painel', 'Membros', 'Atas'], fullPermIds),
      ...cross(roleByName['Presidente'].id, ['Pautas'], allPermIds),

      // Vice-Presidente: same as Presidente
      ...cross(
        roleByName['Vice-Presidente'].id,
        [
          'Categorias de Entradas',
          'Lançamentos de Entradas',
          'Categorias de Saídas',
          'Lançamentos de Saídas',
          'Formas de Pagamento',
          'Fundos Designados'
        ],
        fullPermIds
      ),
      ...cross(roleByName['Vice-Presidente'].id, ['Painel', 'Membros', 'Atas'], fullPermIds),
      ...cross(roleByName['Vice-Presidente'].id, ['Pautas'], allPermIds),

      // Tesoureiro: closings — create + submit only
      ...cross(
        roleByName['Tesoureiro'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar'].map((n) => permByName[n].id)
      ),

      // Tesoureiro Responsável: closings — full (including review + close)
      ...cross(
        roleByName['Tesoureiro Responsável'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map((n) => permByName[n].id)
      ),

      // Presidente: closings — full
      ...cross(
        roleByName['Presidente'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map((n) => permByName[n].id)
      ),

      // Vice-Presidente: closings — full
      ...cross(
        roleByName['Vice-Presidente'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map((n) => permByName[n].id)
      ),

      // Comissão de Exame de Contas: closings — review
      ...cross(
        roleByName['Comissão de Exame de Contas'].id,
        ['Fechamentos Mensais'],
        ['Acessar', 'Revisar'].map((n) => permByName[n].id)
      ),

      // Membro: view only
      ...cross(roleByName['Membro'].id, ['Atas', 'Membros'], [permByName['Acessar'].id])
    ];

    await tx.insert(roleModulePermissions).values(rmpRows);

    // --- Payment Methods ---
    await tx.insert(paymentMethods).values([
      { name: 'Dinheiro', allowsInflow: true, allowsOutflow: true },
      { name: 'Transferência Bancária', allowsInflow: true, allowsOutflow: true },
      { name: 'Cartão de Débito', allowsInflow: true, allowsOutflow: true },
      { name: 'Cartão de Crédito', allowsInflow: false, allowsOutflow: true },
      { name: 'Boleto Bancário', allowsInflow: false, allowsOutflow: true }
    ]);

    // --- Income Categories (2-level chart of accounts) ---
    const [icContribuicoes, icOutrasReceitas] = await tx
      .insert(incomeCategories)
      .values([{ name: 'Contribuições' }, { name: 'Outras Receitas' }])
      .returning();

    await tx.insert(incomeCategories).values([
      { name: 'Dízimo', parentId: icContribuicoes.id, requiresMember: true },
      { name: 'Oferta de Culto', parentId: icContribuicoes.id },
      { name: 'Oferta Missionária', parentId: icContribuicoes.id },
      { name: 'Doação', parentId: icContribuicoes.id },
      { name: 'Rendimentos Financeiros', parentId: icOutrasReceitas.id },
      { name: 'Eventos / Campanhas', parentId: icOutrasReceitas.id }
    ]);

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
  seedProd()
    .then(() => sql.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
