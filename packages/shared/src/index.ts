// Numeric IDs MUST match the seed insert order in apps/api/src/db/seed.ts.
// Append-only — never reorder, never reuse a removed value, never set a value to 0
// (the bit math `1 << (action - 1)` requires action IDs >= 1).
export const Module = {
  Users: 1,
  Roles: 2,
  Permissions: 3,
  Areas: 4,
  Status: 5,
  Members: 6,
  IncomeCategories: 7,
  IncomeEntries: 8,
  ExpenseCategories: 9,
  ExpenseEntries: 10,
  PaymentMethods: 11,
  DesignatedFunds: 12,
  Dashboard: 13,
  Reports: 14,
  MonthlyClosings: 15,
  Agendas: 16,
  Minutes: 17
} as const;
export type Module = (typeof Module)[keyof typeof Module];

export const Action = {
  View: 1,
  Create: 2,
  Update: 3,
  Delete: 4,
  Review: 5,
  Report: 6
} as const;
export type Action = (typeof Action)[keyof typeof Action];

export type PermissionMap = Record<number, number>;

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: PermissionMap;
};

export function hasPermission(
  perms: PermissionMap | undefined,
  module: Module,
  action: Action
): boolean {
  if (!perms) return false;
  return ((perms[module] ?? 0) & (1 << (action - 1))) !== 0;
}

export const ActiveStatus = {
  Active: 'ativo',
  Inactive: 'inativo',
  Pending: 'pendente'
} as const;
export type ActiveStatusValue = (typeof ActiveStatus)[keyof typeof ActiveStatus];

export const EntryStatus = {
  Pending: 'pendente',
  Paid: 'paga',
  Cancelled: 'cancelada'
} as const;
export type EntryStatusValue = (typeof EntryStatus)[keyof typeof EntryStatus];

export const ClosingStatus = {
  Open: 'aberto',
  InReview: 'em revisão',
  Approved: 'aprovado',
  Closed: 'fechado'
} as const;
export type ClosingStatusValue = (typeof ClosingStatus)[keyof typeof ClosingStatus];

export const MinuteStatus = {
  AwaitingApproval: 'aguardando aprovação',
  Approved: 'aprovada',
  Replaced: 'substituída'
} as const;
export type MinuteStatusValue = (typeof MinuteStatus)[keyof typeof MinuteStatus];
