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
