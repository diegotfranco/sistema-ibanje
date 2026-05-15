export const paths = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  roles: '/roles',
  users: '/users',
  attenders: '/attenders',
  paymentMethods: '/payment-methods',
  designatedFunds: '/designated-funds',
  incomeCategories: '/income-categories',
  expenseCategories: '/expense-categories',
  incomeEntries: '/income-entries',
  expenseEntries: '/expense-entries',
  monthlyClosings: '/monthly-closings',
  monthlyClosingDetail: '/monthly-closings/:id',
  reports: '/reports',
  meetings: '/meetings',
  minutes: '/minutes',
  minuteDetail: '/minutes/:id',
  minuteTemplates: '/minute-templates',
  churchSettings: '/church-settings',
  me: '/me'
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
