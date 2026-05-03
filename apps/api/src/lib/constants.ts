export const Module = {
  Users: 'Usuários',
  Roles: 'Cargos',
  Members: 'Membros',
  PaymentMethods: 'Formas de Pagamento',
  DesignatedFunds: 'Fundos Designados',
  IncomeCategories: 'Categorias de Entradas',
  ExpenseCategories: 'Categorias de Saídas',
  IncomeEntries: 'Lançamentos de Entradas',
  ExpenseEntries: 'Lançamentos de Saídas',
  Dashboard: 'Painel',
  Reports: 'Relatórios',
  Agendas: 'Pautas',
  Minutes: 'Atas',
  Permissions: 'Permissões',
  Areas: 'Áreas',
  Status: 'Status',
} as const;

export type ModuleName = (typeof Module)[keyof typeof Module];

export const Action = {
  View: 'Acessar',
  Create: 'Cadastrar',
  Update: 'Editar',
  Delete: 'Remover',
  Report: 'Relatórios',
} as const;

export type ActionName = (typeof Action)[keyof typeof Action];
