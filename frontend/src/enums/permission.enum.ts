export const module = {
  USERS: 1,
  ROLES: 2,
  PERMISSIONS: 3,
  MODULES: 4,
  STATUS: 5,

  MEMBERS: 6,

  INCOME_CATEGORIES: 7,
  INCOME_ENTRIES: 8,

  EXPENSE_CATEGORIES: 9,
  EXPENSE_ENTRIES: 10,

  PAYMENT_METHODS: 11,
  FUNDS: 12,

  DASHBOARD: 13,
  REPORTS: 14,

  PAUTAS: 15,
  ATAS: 16
} as const;

export const action = {
  VIEW: 1,
  CREATE: 2,
  UPDATE: 3,
  DELETE: 4,
  EXPORT: 5
} as const;

export type ModuleKey = keyof typeof module;
export type ActionKey = keyof typeof action;
