import * as argon2 from 'argon2';
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
  monthlyClosings,
  financeSettings
} from './schema.js';

async function hashPassword(password: string) {
  return argon2.hash(password + env.ARGON2_PEPPER, { type: argon2.argon2id });
}

async function seed() {
  console.log('Seeding database...');

  await db.transaction(async (tx) => {
    // Wipe all tables in dependency order so the seed is idempotent on a live DB
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

    // --- Users ---
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

    // --- User-Module-Permissions (copy each user's role permissions) ---
    const umpRows = insertedUsers.flatMap((user) =>
      rmpRows
        .filter((rmp) => rmp.roleId === user.roleId)
        .map((rmp) => ({
          userId: user.id,
          moduleId: rmp.moduleId,
          permissionId: rmp.permissionId
        }))
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
        }
      ])
      .returning();
    const dfByName = Object.fromEntries(insertedFunds.map((f) => [f.name, f]));

    // --- Income Categories (2-level chart of accounts) ---
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
    const icByName: Record<string, (typeof insertedICs)[0]> = Object.fromEntries(
      insertedICs.map((c) => [c.name, c])
    );

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
        { name: 'Manutenção Predial', parentId: ecManutencao.id },
        { name: 'Reparo Hidráulico', parentId: ecManutencao.id },
        { name: 'Reparo Elétrico', parentId: ecManutencao.id },
        { name: 'Compra de Equipamentos', parentId: ecEquipamentos.id },
        { name: 'Despesas com Eventos', parentId: ecEventos.id }
      ])
      .returning();
    const ecByName: Record<string, (typeof insertedECs)[0]> = Object.fromEntries(
      insertedECs.map((c) => [c.name, c])
    );

    // --- Members ---
    // João da Silva is linked to the membro user to demonstrate the member-user relationship
    const insertedMembers = await tx
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
        },
        {
          name: 'Maria Oliveira',
          birthDate: '1992-09-23',
          addressStreet: 'Avenida Principal',
          addressNumber: 456,
          addressDistrict: 'Jardins',
          state: 'RJ',
          city: 'Rio de Janeiro',
          postalCode: '20040030',
          email: 'maria.oliveira@email.com',
          phone: '21965432100'
        },
        {
          name: 'Carlos Pereira',
          birthDate: '1978-11-02',
          addressStreet: 'Travessa dos Sonhos',
          addressNumber: 78,
          addressDistrict: 'Vila Madalena',
          state: 'SP',
          city: 'São Paulo',
          postalCode: '05448000',
          email: 'carlos.pereira@email.com',
          phone: '11998765432',
          status: 'inativo' as const
        },
        {
          name: 'Ana Souza',
          birthDate: '1995-02-20',
          addressStreet: 'Rua da Paz',
          addressNumber: 99,
          addressComplement: 'Casa 2',
          addressDistrict: 'Lapa',
          state: 'SP',
          city: 'São Paulo',
          postalCode: '05069000',
          email: 'ana.souza@email.com',
          phone: '11912345678'
        }
      ])
      .returning();
    const memberByName = Object.fromEntries(insertedMembers.map((m) => [m.name, m]));

    const tesoureiroId = userByEmail['tesoureiro@email.com'].id;
    const tesRespId = userByEmail['tesoureiro.resp@email.com'].id;
    const presidenteId = userByEmail['presidente@email.com'].id;

    // --- Income Entries ---
    await tx.insert(incomeEntries).values([
      // August 2025
      {
        referenceDate: '2025-08-10',
        depositDate: '2025-08-10',
        amount: '550.00',
        categoryId: icByName['Dízimo'].id,
        memberId: memberByName['João da Silva'].id,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      {
        referenceDate: '2025-08-10',
        depositDate: '2025-08-10',
        amount: '250.00',
        categoryId: icByName['Oferta de Culto'].id,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      // September 2025
      {
        referenceDate: '2025-09-07',
        depositDate: '2025-09-07',
        amount: '1200.00',
        categoryId: icByName['Dízimo'].id,
        memberId: memberByName['Maria Oliveira'].id,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      {
        referenceDate: '2025-09-07',
        depositDate: '2025-09-07',
        amount: '320.00',
        categoryId: icByName['Oferta de Culto'].id,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      {
        referenceDate: '2025-09-30',
        depositDate: '2025-09-30',
        amount: '200.00',
        categoryId: icByName['Doação'].id,
        memberId: memberByName['João da Silva'].id,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      // October 2025
      {
        referenceDate: '2025-10-05',
        depositDate: '2025-10-05',
        amount: '500.00',
        categoryId: icByName['Dízimo'].id,
        memberId: memberByName['Ana Souza'].id,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      {
        referenceDate: '2025-10-12',
        depositDate: '2025-10-12',
        amount: '150.00',
        categoryId: icByName['Oferta de Culto'].id,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      {
        referenceDate: '2025-10-19',
        depositDate: '2025-10-19',
        amount: '350.00',
        categoryId: icByName['Oferta Missionária'].id,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        userId: tesoureiroId,
        designatedFundId: dfByName['Fundo Missionário'].id
      },
      {
        referenceDate: '2025-10-26',
        depositDate: '2025-10-26',
        amount: '120.00',
        categoryId: icByName['Oferta Missionária'].id,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'paga',
        userId: tesoureiroId
      },
      {
        referenceDate: '2025-10-20',
        depositDate: '2025-10-21',
        amount: '1000.00',
        categoryId: icByName['Doação'].id,
        memberId: memberByName['Maria Oliveira'].id,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'pendente',
        userId: tesoureiroId
      },
      // Dia das Crianças campaign — income side
      {
        referenceDate: '2025-10-05',
        depositDate: '2025-10-05',
        amount: '800.00',
        categoryId: icByName['Eventos / Campanhas'].id,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'paga',
        userId: tesoureiroId,
        designatedFundId: dfByName['Dia das Crianças'].id
      },
      // Maria sponsors the freezer — donation income paired with sponsored expense
      {
        referenceDate: '2025-11-10',
        depositDate: '2025-11-10',
        amount: '500.00',
        categoryId: icByName['Doação'].id,
        memberId: memberByName['Maria Oliveira'].id,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        userId: tesoureiroId
      }
    ]);

    // --- Expense Entries ---
    await tx.insert(expenseEntries).values([
      // August 2025
      {
        referenceDate: '2025-08-15',
        description: 'Conta de água – agosto',
        total: '260.00',
        amount: '260.00',
        categoryId: ecByName['Água'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Boleto Bancário'].id,
        status: 'paga'
      },
      {
        referenceDate: '2025-08-20',
        description: 'Honorário pastoral – agosto',
        total: '400.00',
        amount: '400.00',
        categoryId: ecByName['Honorários Pastorais'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga'
      },
      {
        referenceDate: '2025-08-25',
        description: 'Conta de energia – agosto',
        total: '360.00',
        amount: '360.00',
        categoryId: ecByName['Energia'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Boleto Bancário'].id,
        status: 'paga'
      },
      // September 2025
      {
        referenceDate: '2025-09-05',
        description: 'Serviço de jardinagem',
        total: '180.00',
        amount: '180.00',
        categoryId: ecByName['Manutenção Predial'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'cancelada' as const
      },
      {
        referenceDate: '2025-09-12',
        description: 'Reparo no encanamento',
        total: '450.00',
        amount: '450.00',
        categoryId: ecByName['Reparo Hidráulico'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'paga'
      },
      {
        referenceDate: '2025-09-15',
        description: 'Conta de água – setembro',
        total: '255.00',
        amount: '255.00',
        categoryId: ecByName['Água'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Boleto Bancário'].id,
        status: 'paga'
      },
      {
        referenceDate: '2025-09-20',
        description: 'Honorário pastoral – setembro',
        total: '400.00',
        amount: '400.00',
        categoryId: ecByName['Honorários Pastorais'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga'
      },
      {
        referenceDate: '2025-09-25',
        description: 'Conta de energia – setembro',
        total: '355.00',
        amount: '355.00',
        categoryId: ecByName['Energia'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Boleto Bancário'].id,
        status: 'paga'
      },
      // October 2025
      {
        referenceDate: '2025-10-10',
        description: 'Conta de água – outubro',
        total: '250.00',
        amount: '250.00',
        categoryId: ecByName['Água'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Boleto Bancário'].id,
        status: 'paga'
      },
      {
        referenceDate: '2025-10-15',
        description: 'Honorário pastoral – outubro',
        total: '400.00',
        amount: '400.00',
        categoryId: ecByName['Honorários Pastorais'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga'
      },
      {
        referenceDate: '2025-10-25',
        description: 'Conta de energia – outubro',
        total: '350.00',
        amount: '350.00',
        categoryId: ecByName['Energia'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Boleto Bancário'].id,
        status: 'pendente'
      },
      // Dia das Crianças campaign — expense side
      {
        referenceDate: '2025-10-05',
        description: 'Despesas com Dia das Crianças',
        total: '650.00',
        amount: '650.00',
        categoryId: ecByName['Despesas com Eventos'].id,
        userId: tesoureiroId,
        paymentMethodId: pmByName['Dinheiro'].id,
        status: 'paga',
        designatedFundId: dfByName['Dia das Crianças'].id
      }
    ]);

    // Multi-installment expense: projector purchase over 3 months
    const [projInst1] = await tx
      .insert(expenseEntries)
      .values({
        referenceDate: '2025-10-01',
        description: 'Projetor Multimídia – Parcela 1/3',
        total: '1500.00',
        amount: '500.00',
        installment: 1,
        totalInstallments: 3,
        categoryId: ecByName['Compra de Equipamentos'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Cartão de Crédito'].id,
        status: 'paga'
      })
      .returning();

    await tx.insert(expenseEntries).values([
      {
        parentId: projInst1.id,
        referenceDate: '2025-11-01',
        description: 'Projetor Multimídia – Parcela 2/3',
        total: '1500.00',
        amount: '500.00',
        installment: 2,
        totalInstallments: 3,
        categoryId: ecByName['Compra de Equipamentos'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Cartão de Crédito'].id,
        status: 'pendente'
      },
      {
        parentId: projInst1.id,
        referenceDate: '2025-12-01',
        description: 'Projetor Multimídia – Parcela 3/3',
        total: '1500.00',
        amount: '500.00',
        installment: 3,
        totalInstallments: 3,
        categoryId: ecByName['Compra de Equipamentos'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Cartão de Crédito'].id,
        status: 'pendente'
      }
    ]);

    // Multi-installment expense sponsored by Maria — freezer, 10 installments
    const [freezerInst1] = await tx
      .insert(expenseEntries)
      .values({
        referenceDate: '2025-09-10',
        description: 'Freezer – Parcela 1/10',
        total: '5000.00',
        amount: '500.00',
        installment: 1,
        totalInstallments: 10,
        categoryId: ecByName['Compra de Equipamentos'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        memberId: memberByName['Maria Oliveira'].id
      })
      .returning();

    await tx.insert(expenseEntries).values([
      {
        parentId: freezerInst1.id,
        referenceDate: '2025-10-10',
        description: 'Freezer – Parcela 2/10',
        total: '5000.00',
        amount: '500.00',
        installment: 2,
        totalInstallments: 10,
        categoryId: ecByName['Compra de Equipamentos'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        memberId: memberByName['Maria Oliveira'].id
      },
      {
        parentId: freezerInst1.id,
        referenceDate: '2025-11-10',
        description: 'Freezer – Parcela 3/10',
        total: '5000.00',
        amount: '500.00',
        installment: 3,
        totalInstallments: 10,
        categoryId: ecByName['Compra de Equipamentos'].id,
        userId: tesRespId,
        paymentMethodId: pmByName['Transferência Bancária'].id,
        status: 'paga',
        memberId: memberByName['Maria Oliveira'].id
      }
    ]);

    // --- Board Meetings ---
    const adminId = userByEmail['admin@email.com'].id;

    const insertedMeetings = await tx
      .insert(boardMeetings)
      .values([
        {
          meetingDate: '2023-03-12',
          type: 'ordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2023-03-01T10:00:00Z'),
          agendaContent: {
            ops: [
              { insert: 'Pauta da Assembleia Ordinária\n', attributes: { header: 1 } },
              { insert: '1. Oração inicial\n', attributes: { list: 'ordered' } },
              {
                insert: '2. Leitura e aprovação da Ata anterior (Nº 718)\n',
                attributes: { list: 'ordered' }
              },
              {
                insert: '3. Apresentação do Relatório Financeiro (Janeiro e Fevereiro 2023)\n',
                attributes: { list: 'ordered' }
              },
              {
                insert: '4. Deliberação sobre o apoio a seminaristas\n',
                attributes: { list: 'ordered' }
              },
              { insert: '5. Oração de encerramento\n', attributes: { list: 'ordered' } }
            ]
          }
        },
        {
          meetingDate: '2023-11-12',
          type: 'extraordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2023-11-01T14:00:00Z'),
          agendaContent: {
            ops: [
              { insert: 'Pauta da Assembleia Extraordinária\n', attributes: { header: 1 } },
              {
                insert: '1. Eleição e posse da diretoria para o exercício de 2024.\n',
                attributes: { list: 'ordered' }
              }
            ]
          }
        },
        {
          meetingDate: '2025-02-15',
          type: 'ordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2025-02-05T09:00:00Z'),
          agendaContent: {
            ops: [
              { insert: 'Assembleia Ordinária 15/02/2025\n', attributes: { header: 1 } },
              { insert: 'Ordem do Dia\n', attributes: { header: 2 } },
              { insert: 'Leitura e aprovação das atas anteriores\n' },
              { insert: 'Leitura e aprovação do Relatório Financeiro\n' },
              { insert: 'Movimento de Membros\n', attributes: { bold: true } },
              {
                insert:
                  'Saída: Promovido para a Nova Jerusalém Celestial irmão Paulo Rodrigues de Oliveira, dia 30/01/2025\n'
              },
              {
                insert: 'Metas Ministeriais e Estruturais para 2025\n',
                attributes: { bold: true }
              },
              { insert: 'Apresentação do Orçamento Anual 2025\n', attributes: { bold: true } }
            ]
          }
        },
        {
          meetingDate: '2025-04-26',
          type: 'ordinária' as const,
          agendaAuthorId: adminId,
          agendaCreatedAt: new Date('2025-04-15T11:00:00Z'),
          agendaContent: {
            ops: [
              { insert: 'Pauta da Assembleia de Abril\n', attributes: { header: 1 } },
              { insert: 'Assuntos gerais e planejamento do retiro de Páscoa.\n' }
            ]
          }
        }
      ])
      .returning();

    const meetingByDate = Object.fromEntries(insertedMeetings.map((m) => [m.meetingDate, m]));
    const secResp = userByEmail['secretario.resp@email.com'];

    // --- Minutes & Versions ---

    // Ata 719
    const [minute719] = await tx
      .insert(minutes)
      .values({
        boardMeetingId: meetingByDate['2023-03-12'].id,
        minuteNumber: '719'
      })
      .returning();

    await tx.insert(minuteVersions).values({
      minuteId: minute719.id,
      version: 1,
      status: 'aprovada' as const,
      reasonForChange: 'Criação inicial da ata.',
      createdByUserId: secResp.id,
      approvedAtMeetingId: meetingByDate['2023-03-12'].id,
      content: {
        ops: [
          { insert: 'Ata de número 719\n', attributes: { header: 1 } },
          {
            insert:
              'No dia 12 de março de 2023, às 17:10hs, o Pastor Deucir Araújo de Almeida, declarou aberta a assembleia. Foi lida e aprovada a Ata de nº 718. Foi lido o Relatório Financeiro referente aos meses de janeiro e fevereiro de 2023. Foram aprovados os apoios financeiros aos seminaristas Dárcio Batista Campos e Andrew Cavalheiro Costa Leite, e a continuidade do auxílio a Cristiano Roberto Valente. A assembleia foi encerrada com uma oração.\n'
          }
        ]
      }
    });

    // Ata 723
    const [minute723] = await tx
      .insert(minutes)
      .values({
        boardMeetingId: meetingByDate['2023-11-12'].id,
        minuteNumber: '723'
      })
      .returning();

    await tx.insert(minuteVersions).values({
      minuteId: minute723.id,
      version: 1,
      status: 'aprovada' as const,
      reasonForChange: 'Criação inicial da ata.',
      createdByUserId: secResp.id,
      approvedAtMeetingId: meetingByDate['2023-11-12'].id,
      content: {
        ops: [
          { insert: 'Ata de número 723 - Assembleia Extraordinária\n', attributes: { header: 1 } },
          {
            insert:
              'Realizada no dia 12 de novembro de 2023, com o propósito de eleger e empossar a diretoria para o exercício administrativo de 2024. A proposta da comissão foi aceita e aprovada por unanimidade. A diretoria eleita tomou posse nesta data. A assembleia foi encerrada às 19:30hs.\n'
          }
        ]
      }
    });

    // Ata 725 — two versions to demonstrate versioning
    const [minute725] = await tx
      .insert(minutes)
      .values({
        boardMeetingId: meetingByDate['2025-04-26'].id,
        minuteNumber: '725'
      })
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
          ops: [
            { insert: 'Ata de número 725 - Versão Original\n', attributes: { header: 1 } },
            {
              insert:
                'Discussão sobre os preparativos para o Retiro de Páscoa. Foi aprovado o orçamento de R$ 5.000,00 para o evento.\n'
            }
          ]
        }
      },
      {
        minuteId: minute725.id,
        version: 2,
        status: 'aguardando aprovação' as const,
        reasonForChange: 'Correção do valor do orçamento e adição da equipe de louvor.',
        createdByUserId: secResp.id,
        content: {
          ops: [
            { insert: 'Ata de número 725 - Versão Corrigida\n', attributes: { header: 1 } },
            {
              insert:
                'Discussão sobre os preparativos para o Retiro de Páscoa. Foi aprovado o orçamento de R$ 5.500,00 para o evento. Foi incluída também a organização de uma equipe de louvor específica para o retiro.\n'
            }
          ]
        }
      }
    ]);

    // --- Finance Settings (singleton — stores initial opening balance) ---
    await tx.insert(financeSettings).values({ openingBalance: '0.00' });

    // --- Monthly Closings ---
    await tx.insert(monthlyClosings).values([
      {
        periodYear: 2025,
        periodMonth: 8,
        closingBalance: '-220.00',
        treasurerNotes: 'Mês com déficit devido a gastos extraordinários.',
        status: 'fechado' as const,
        submittedByUserId: tesoureiroId,
        submittedAt: new Date('2025-09-03T10:00:00Z'),
        reviewedAt: new Date('2025-09-05T14:00:00Z'),
        closedByUserId: presidenteId,
        closedAt: new Date('2025-09-05T15:00:00Z')
      },
      {
        periodYear: 2025,
        periodMonth: 9,
        closingBalance: '710.00',
        treasurerNotes: 'Mês regular, sem intercorrências.',
        status: 'aprovado' as const,
        submittedByUserId: tesoureiroId,
        submittedAt: new Date('2025-10-03T10:00:00Z'),
        reviewedAt: new Date('2025-10-07T14:00:00Z')
      },
      {
        periodYear: 2025,
        periodMonth: 10,
        status: 'aberto' as const
      }
    ]);
  });

  await sql.end();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
