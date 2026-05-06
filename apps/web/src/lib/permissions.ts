import type { Permission } from '@sistema-ibanje/shared';

// TODO: Move to packages/shared (requires import of constants across apps)
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
  MonthlyClosings: 'Fechamentos Mensais',
  Dashboard: 'Painel',
  Reports: 'Relatórios',
  Agendas: 'Pautas',
  Minutes: 'Atas',
  Permissions: 'Permissões',
  Areas: 'Áreas',
  Status: 'Status'
} as const;

export type ModuleName = (typeof Module)[keyof typeof Module];

export const Action = {
  View: 'Acessar',
  Create: 'Cadastrar',
  Update: 'Editar',
  Delete: 'Remover',
  Review: 'Revisar',
  Report: 'Relatórios'
} as const;

export type ActionName = (typeof Action)[keyof typeof Action];

export type { Permission };

export function hasPermission(
  userPerms: Permission[] | undefined,
  module: string,
  action: string = Action.View
): boolean {
  if (!userPerms) return false;
  return userPerms.some((p) => p.module === module && p.action === action);
}
