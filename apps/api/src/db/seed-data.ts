/**
 * Shared structural seed data used by both seed.ts (dev) and seed.prod.ts (production).
 * Changing names or order here affects the shared/index.ts Action and Module enums — append only.
 */

export const SEED_ROLES = [
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
];

// ORDER MATTERS — IDs referenced by packages/shared/src/index.ts (Action enum). APPEND ONLY.
export const SEED_PERMISSIONS = [
  { name: 'Acessar', description: 'Permite acesso à área do sistema' },
  { name: 'Cadastrar', description: 'Permite adicionar um registro' },
  { name: 'Editar', description: 'Permite editar um registro' },
  { name: 'Remover', description: 'Permite remover um registro' },
  { name: 'Revisar', description: 'Permite revisar e aprovar um registro' },
  { name: 'Relatórios', description: 'Permite gerar relatórios' }
];

export const EXPECTED_PERMISSION_ORDER = [
  'Acessar',
  'Cadastrar',
  'Editar',
  'Remover',
  'Revisar',
  'Relatórios'
];

// ORDER MATTERS — IDs referenced by packages/shared/src/index.ts (Module enum). APPEND ONLY.
export const SEED_MODULES = [
  { name: 'Usuários', description: 'Gerencia os usuários do sistema' },
  { name: 'Cargos', description: 'Gerencia os cargos e funções do sistema' },
  { name: 'Permissões', description: 'Gerencia os tipos de permissões disponíveis' },
  { name: 'Áreas', description: 'Gerencia as seções funcionais do sistema' },
  { name: 'Status', description: 'Gerencia os status dos registros do sistema' },
  { name: 'Membros', description: 'Gerencia os membros da igreja' },
  { name: 'Categorias de Entradas', description: 'Gerencia os tipos de entradas financeiras' },
  { name: 'Lançamentos de Entradas', description: 'Gerencia o registro de entradas financeiras' },
  { name: 'Categorias de Saídas', description: 'Gerencia os tipos de saídas financeiras' },
  { name: 'Lançamentos de Saídas', description: 'Gerencia o registro de saídas financeiras' },
  { name: 'Formas de Pagamento', description: 'Gerencia as formas de pagamento disponíveis' },
  { name: 'Fundos Designados', description: 'Gerencia os fundos designados da igreja' },
  { name: 'Painel', description: 'Painel com informações e estatísticas do sistema' },
  {
    name: 'Relatórios',
    description: 'Área destinada à geração de relatórios financeiros e administrativos'
  },
  { name: 'Fechamentos Mensais', description: 'Gerencia os fechamentos mensais de tesouraria' },
  { name: 'Pautas', description: 'Gerencia as pautas das reuniões da diretoria' },
  { name: 'Atas', description: 'Gerencia as atas das reuniões da diretoria' }
];

export const EXPECTED_MODULE_ORDER = SEED_MODULES.map((m) => m.name);

export const SEED_PAYMENT_METHODS = [
  { name: 'Dinheiro', allowsInflow: true, allowsOutflow: true },
  { name: 'Transferência Bancária', allowsInflow: true, allowsOutflow: true },
  { name: 'Cartão de Débito', allowsInflow: true, allowsOutflow: true },
  { name: 'Cartão de Crédito', allowsInflow: false, allowsOutflow: true },
  { name: 'Boleto Bancário', allowsInflow: false, allowsOutflow: true }
];

export const SEED_INCOME_CATEGORY_PARENTS = ['Contribuições', 'Outras Receitas'] as const;

export function buildIncomeCategoryChildren(parentByName: Record<string, { id: number }>) {
  return [
    { name: 'Dízimo', parentId: parentByName['Contribuições'].id, requiresMember: true },
    { name: 'Oferta de Culto', parentId: parentByName['Contribuições'].id },
    { name: 'Oferta Missionária', parentId: parentByName['Contribuições'].id },
    { name: 'Doação', parentId: parentByName['Contribuições'].id },
    { name: 'Rendimentos Financeiros', parentId: parentByName['Outras Receitas'].id },
    { name: 'Eventos / Campanhas', parentId: parentByName['Outras Receitas'].id }
  ];
}

export function buildRoleModulePermissions(
  roleByName: Record<string, { id: number }>,
  modByName: Record<string, { id: number }>,
  permByName: Record<string, { id: number }>,
  allModNames: string[]
): { roleId: number; moduleId: number; permissionId: number }[] {
  const cross = (roleId: number, moduleNames: string[], permIds: number[]) =>
    moduleNames.flatMap((mod) =>
      permIds.map((permId) => ({ roleId, moduleId: modByName[mod].id, permissionId: permId }))
    );

  const allPermIds = Object.values(permByName).map((p) => p.id);
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
  const closingFullIds = ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map(
    (n) => permByName[n].id
  );

  return [
    ...cross(roleByName['Administrador'].id, allModNames, allPermIds),
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
      [permByName['Acessar'].id, permByName['Cadastrar'].id]
    ),
    ...cross(roleByName['Tesoureiro Responsável'].id, ['Fechamentos Mensais'], closingFullIds),
    ...cross(roleByName['Presidente'].id, ['Fechamentos Mensais'], closingFullIds),
    ...cross(roleByName['Vice-Presidente'].id, ['Fechamentos Mensais'], closingFullIds),
    ...cross(
      roleByName['Comissão de Exame de Contas'].id,
      ['Fechamentos Mensais'],
      [permByName['Acessar'].id, permByName['Revisar'].id]
    ),
    ...cross(roleByName['Membro'].id, ['Atas', 'Membros'], [permByName['Acessar'].id])
  ];
}
