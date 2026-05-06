export const paths = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard'
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
