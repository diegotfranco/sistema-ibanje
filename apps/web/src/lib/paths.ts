export const paths = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  paymentMethods: '/payment-methods',
  designatedFunds: '/designated-funds',
  incomeCategories: '/income-categories',
  expenseCategories: '/expense-categories',
  incomeEntries: '/income-entries',
  expenseEntries: '/expense-entries',
  monthlyClosings: '/monthly-closings',
  monthlyClosingDetail: '/monthly-closings/:id'
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
