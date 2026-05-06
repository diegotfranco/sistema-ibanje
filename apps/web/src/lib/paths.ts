export const paths = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  paymentMethods: '/payment-methods',
  designatedFunds: '/designated-funds',
  incomeCategories: '/income-categories',
  expenseCategories: '/expense-categories'
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
