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
    description: 'Gestão completa de atas e congregados, incluindo remoção de registros.'
  },
  {
    name: 'Secretário',
    description: 'Gestão de atas e congregados, sem permissão para remover registros.'
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
  { name: 'Congregados', description: 'Gerencia os congregados da igreja' },
  { name: 'Categorias de Entradas', description: 'Gerencia os tipos de entradas financeiras' },
  { name: 'Lançamentos de Entradas', description: 'Gerencia o registro de entradas financeiras' },
  { name: 'Categorias de Saídas', description: 'Gerencia os tipos de saídas financeiras' },
  { name: 'Lançamentos de Saídas', description: 'Gerencia o registro de saídas financeiras' },
  { name: 'Formas de Pagamento', description: 'Gerencia as formas de pagamento disponíveis' },
  { name: 'Campanhas', description: 'Gerencia as campanhas da igreja' },
  { name: 'Painel', description: 'Painel com informações e estatísticas do sistema' },
  {
    name: 'Relatórios',
    description: 'Área destinada à geração de relatórios financeiros e administrativos'
  },
  { name: 'Fechamentos Mensais', description: 'Gerencia os fechamentos mensais de tesouraria' },
  { name: 'Pautas', description: 'Gerencia as pautas das reuniões da diretoria' },
  { name: 'Atas', description: 'Gerencia as atas das reuniões da diretoria' },
  { name: 'Cartas de Membros', description: 'Gerencia as cartas de transferência de membros' },
  { name: 'Modelos de Ata', description: 'Gerencia os modelos de ata para assembleias' },
  { name: 'Dados da Igreja', description: 'Gerencia os dados institucionais da igreja' }
];

export const EXPECTED_MODULE_ORDER = SEED_MODULES.map((m) => m.name);

export const SEED_PAYMENT_METHODS = [
  { name: 'Dinheiro', allowsInflow: true, allowsOutflow: true },
  { name: 'Transferência Bancária', allowsInflow: true, allowsOutflow: true },
  { name: 'Cartão de Débito', allowsInflow: true, allowsOutflow: true },
  { name: 'Cartão de Crédito', allowsInflow: false, allowsOutflow: true },
  { name: 'Boleto Bancário', allowsInflow: false, allowsOutflow: true }
];

export const SEED_MEETING_TYPES = {
  Ordinary: 'ordinária',
  Extraordinary: 'extraordinária'
} as const;

/**
 * Structural designated funds — present in every dev/prod seed.
 * Historical campaign funds are appended at dev-seed time from fixtures/designated_funds.json.
 */
export const SEED_DESIGNATED_FUNDS: {
  name: string;
  description?: string | null;
  targetAmount?: string;
}[] = [
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
  { name: 'PAM', description: 'Plano de Auxílio Missionário' }
];

/**
 * Income taxonomy — category answers WHAT kind of inflow.
 * The WHERE-it's-earmarked dimension lives in designated_funds (e.g. missionary offering =
 * Oferta + Fundo Missionário; campaign contribution = Oferta + the specific Campanha X fund).
 */
export const SEED_INCOME_CATEGORY_PARENTS = [
  {
    name: 'Contribuições',
    description: 'Receitas vindas dos próprios membros e visitantes da igreja.'
  },
  {
    name: 'Outras Receitas',
    description: 'Receitas que não vêm de contribuições diretas dos membros.'
  }
] as const;

export function buildIncomeCategoryChildren(parentByName: Record<string, { id: number }>) {
  return [
    {
      name: 'Dízimo',
      parentId: parentByName['Contribuições'].id,
      requiresMember: true,
      description: 'Contribuição regular de 10% praticada pelos membros.'
    },
    {
      name: 'Oferta',
      parentId: parentByName['Contribuições'].id,
      description: 'Contribuição voluntária dada durante cultos e atividades.'
    },
    {
      name: 'Doação',
      parentId: parentByName['Contribuições'].id,
      description: 'Valor entregue à igreja fora do contexto de culto, por membros ou terceiros.'
    },
    {
      name: 'Eventos',
      parentId: parentByName['Outras Receitas'].id,
      description: 'Arrecadação proveniente de eventos promovidos pela igreja.'
    },
    {
      name: 'Rendimentos Financeiros',
      parentId: parentByName['Outras Receitas'].id,
      description: 'Juros e rendimentos de aplicações financeiras da igreja.'
    },
    {
      name: 'Aluguel de Espaço',
      parentId: parentByName['Outras Receitas'].id,
      description: 'Receita de cessão temporária de salões, quadras ou outros espaços da igreja.'
    },
    {
      name: 'Venda de Material',
      parentId: parentByName['Outras Receitas'].id,
      description: 'Venda de livros, materiais didáticos, lanches e demais itens pela igreja.'
    }
  ];
}

export const SEED_EXPENSE_CATEGORY_PARENTS = [
  { name: 'Pessoal', description: 'Despesas relacionadas a pessoas que trabalham para a igreja.' },
  {
    name: 'Administrativo',
    description: 'Despesas com a gestão burocrática e contábil da igreja.'
  },
  {
    name: 'Operacional',
    description: 'Despesas recorrentes para manter o funcionamento do imóvel.'
  },
  {
    name: 'Manutenção',
    description: 'Reparos e conservação da estrutura física da igreja.'
  },
  {
    name: 'Equipamentos',
    description: 'Aquisição e reposição de bens duráveis usados pela igreja.'
  },
  {
    name: 'Eventos / Programas',
    description: 'Despesas com cultos especiais, retiros, conferências e demais programas.'
  },
  {
    name: 'Missões',
    description: 'Repasses e auxílios para o trabalho missionário dentro e fora do país.'
  },
  {
    name: 'Contribuições Eclesiásticas',
    description: 'Contribuições obrigatórias pagas a entidades denominacionais.'
  },
  {
    name: 'Auxílios',
    description: 'Auxílios concedidos a membros e cooperadores no exercício do ministério.'
  },
  {
    name: 'Diversos',
    description: 'Despesas que não se encaixam nas demais categorias.'
  }
];

export function buildExpenseCategoryChildren(parentByName: Record<string, { id: number }>) {
  return [
    {
      name: 'Honorários Pastorais',
      parentId: parentByName['Pessoal'].id,
      description: 'Remuneração mensal dos pastores.'
    },
    {
      name: 'FGTM',
      parentId: parentByName['Pessoal'].id,
      description: 'Fundo de Garantia para o Tempo de Ministério.'
    },
    {
      name: 'Encargos',
      parentId: parentByName['Pessoal'].id,
      description: 'Encargos sociais e tributários sobre a folha de pessoal.'
    },
    {
      name: 'Treinamento / Desenvolvimento',
      parentId: parentByName['Pessoal'].id,
      description: 'Cursos, congressos e capacitação dos colaboradores e ministros.'
    },
    {
      name: 'Contador',
      parentId: parentByName['Administrativo'].id,
      description: 'Honorários do serviço contábil da igreja.'
    },
    {
      name: 'Material de Expediente',
      parentId: parentByName['Administrativo'].id,
      description: 'Suprimentos de papelaria e escritório usados na rotina administrativa.'
    },
    {
      name: 'Cartório / Registros',
      parentId: parentByName['Administrativo'].id,
      description: 'Taxas cartoriais, certidões e registros legais.'
    },
    {
      name: 'Assinaturas / Software',
      parentId: parentByName['Administrativo'].id,
      description: 'Mensalidades de softwares e assinaturas digitais utilizadas pela igreja.'
    },
    {
      name: 'Tarifa Bancária',
      parentId: parentByName['Administrativo'].id,
      description: 'Tarifas e taxas cobradas pelo banco da igreja.'
    },
    {
      name: 'Água',
      parentId: parentByName['Operacional'].id,
      description: 'Conta mensal de fornecimento de água.'
    },
    {
      name: 'Energia',
      parentId: parentByName['Operacional'].id,
      description: 'Conta mensal de fornecimento de energia elétrica.'
    },
    {
      name: 'Internet / Telefone',
      parentId: parentByName['Operacional'].id,
      description: 'Serviços de internet e telefonia da igreja.'
    },
    {
      name: 'Vigilância Patrimonial',
      parentId: parentByName['Operacional'].id,
      description: 'Monitoramento e segurança do imóvel.'
    },
    {
      name: 'Material de Limpeza',
      parentId: parentByName['Operacional'].id,
      description: 'Produtos e insumos usados na limpeza do templo e demais espaços.'
    },
    {
      name: 'Seguros',
      parentId: parentByName['Operacional'].id,
      description: 'Apólices de seguro do imóvel e dos bens da igreja.'
    },
    {
      name: 'Manutenção Predial',
      parentId: parentByName['Manutenção'].id,
      description: 'Reparos gerais de pintura, alvenaria e conservação do prédio.'
    },
    {
      name: 'Reparo Hidráulico',
      parentId: parentByName['Manutenção'].id,
      description: 'Conserto de encanamentos, torneiras e instalações hidráulicas.'
    },
    {
      name: 'Reparo Elétrico',
      parentId: parentByName['Manutenção'].id,
      description: 'Conserto de fiação, tomadas e instalações elétricas.'
    },
    {
      name: 'Compra de Equipamentos',
      parentId: parentByName['Equipamentos'].id,
      description: 'Aquisição de equipamentos de som, vídeo, mobiliário ou eletrônicos.'
    },
    {
      name: 'Despesas com Eventos',
      parentId: parentByName['Eventos / Programas'].id,
      description: 'Custos diretos de realização de eventos da igreja.'
    },
    {
      name: 'Material Didático',
      parentId: parentByName['Eventos / Programas'].id,
      description: 'Apostilas, livros e materiais usados nas atividades de ensino.'
    },
    {
      name: 'Gratificações',
      parentId: parentByName['Eventos / Programas'].id,
      description: 'Gratificações pagas a preletores e colaboradores convidados.'
    },
    {
      name: 'Missões Nacionais',
      parentId: parentByName['Missões'].id,
      description: 'Repasses para o trabalho missionário dentro do Brasil.'
    },
    {
      name: 'Missões Mundiais',
      parentId: parentByName['Missões'].id,
      description: 'Repasses para missionários e projetos no exterior.'
    },
    {
      name: 'PAM',
      parentId: parentByName['Missões'].id,
      description: 'Plano de Auxílio Missionário.'
    },
    {
      name: 'Auxílio a Seminarista',
      parentId: parentByName['Missões'].id,
      description: 'Apoio financeiro a estudantes de seminário.'
    },
    {
      name: 'Auxílio a Pastor em Formação',
      parentId: parentByName['Missões'].id,
      description: 'Apoio financeiro a pastores em processo de formação ministerial.'
    },
    {
      name: 'Plano Cooperativo',
      parentId: parentByName['Contribuições Eclesiásticas'].id,
      description: 'Contribuição denominacional para o Plano Cooperativo.'
    },
    {
      name: 'Acibams',
      parentId: parentByName['Contribuições Eclesiásticas'].id,
      description: 'Contribuição à associação regional de igrejas (Acibams).'
    },
    {
      name: 'Auxílio Combustível',
      parentId: parentByName['Auxílios'].id,
      description: 'Reembolso de combustível para deslocamentos a serviço da igreja.'
    },
    {
      name: 'Transporte / Deslocamento',
      parentId: parentByName['Auxílios'].id,
      description: 'Passagens, locação de veículos e demais despesas de deslocamento.'
    },
    {
      name: 'Outras Despesas',
      parentId: parentByName['Diversos'].id,
      description: 'Despesas pontuais que não se encaixam nas demais categorias.'
    }
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
    'Campanhas'
  ];
  const adminMods = ['Painel', 'Congregados', 'Atas'];
  const closingFullIds = ['Acessar', 'Cadastrar', 'Revisar', 'Editar', 'Remover'].map(
    (n) => permByName[n].id
  );
  // Comissão precisa anotar correções durante a revisão antes de aprovar — Editar habilita isso.
  const examCommissionClosingIds = ['Acessar', 'Editar', 'Revisar'].map((n) => permByName[n].id);

  return [
    ...cross(roleByName['Administrador'].id, allModNames, allPermIds),
    ...cross(roleByName['Tesoureiro'].id, ['Painel', ...financialMods], writePermIds),
    ...cross(roleByName['Tesoureiro'].id, ['Congregados', 'Atas'], readPermIds),
    ...cross(
      roleByName['Comissão de Exame de Contas'].id,
      ['Painel', ...financialMods],
      readPermIds
    ),
    ...cross(roleByName['Tesoureiro Responsável'].id, ['Painel', ...financialMods], fullPermIds),
    ...cross(roleByName['Tesoureiro Responsável'].id, ['Congregados', 'Atas'], readPermIds),
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
      examCommissionClosingIds
    ),
    ...cross(roleByName['Membro'].id, ['Atas', 'Congregados'], [permByName['Acessar'].id]),
    ...cross(roleByName['Secretário'].id, ['Cartas de Membros', 'Modelos de Ata'], writePermIds),
    ...cross(
      roleByName['Secretário Responsável'].id,
      ['Cartas de Membros', 'Modelos de Ata'],
      fullPermIds
    ),
    ...cross(roleByName['Presidente'].id, ['Dados da Igreja'], fullPermIds),
    ...cross(roleByName['Vice-Presidente'].id, ['Dados da Igreja'], fullPermIds),
    ...cross(roleByName['Secretário Responsável'].id, ['Dados da Igreja'], fullPermIds),
    ...cross(roleByName['Secretário'].id, ['Dados da Igreja'], readPermIds)
  ];
}

/**
 * Demo login accounts seeded in dev. One per role so every RBAC branch can be exercised
 * by logging in. Passwords are throwaway and only valid in development.
 */
export type SeedDemoUser = {
  name: string;
  email: string;
  password: string;
  roleName: string;
};

export const SEED_DEMO_USERS: SeedDemoUser[] = [
  {
    name: 'Administrador da Silva',
    email: 'admin@email.com',
    password: 'admin123',
    roleName: 'Administrador'
  },
  {
    name: 'Presidente da Silva',
    email: 'presidente@email.com',
    password: 'presidente123',
    roleName: 'Presidente'
  },
  {
    name: 'Vice Presidente da Silva',
    email: 'vice.presidente@email.com',
    password: 'vicepres123',
    roleName: 'Vice-Presidente'
  },
  {
    name: 'Tesoureiro Responsável da Silva',
    email: 'tesoureiro.resp@email.com',
    password: 'tesresp123',
    roleName: 'Tesoureiro Responsável'
  },
  {
    name: 'Tesoureiro da Silva',
    email: 'tesoureiro@email.com',
    password: 'tesoureiro123',
    roleName: 'Tesoureiro'
  },
  {
    name: 'Secretário Responsável da Silva',
    email: 'secretario.resp@email.com',
    password: 'secresp123',
    roleName: 'Secretário Responsável'
  },
  {
    name: 'Secretário da Silva',
    email: 'secretario@email.com',
    password: 'secretario123',
    roleName: 'Secretário'
  },
  {
    name: 'Comissão da Silva',
    email: 'comissao@email.com',
    password: 'comissao123',
    roleName: 'Comissão de Exame de Contas'
  },
  {
    name: 'Membro da Silva',
    email: 'membro@email.com',
    password: 'membro123',
    roleName: 'Membro'
  }
];

export const SEED_CHURCH_SETTINGS = {
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
} as const;
