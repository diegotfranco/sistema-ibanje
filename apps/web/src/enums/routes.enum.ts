const routes = {
  ROOT: { path: '/dashboard' },
  LOGIN: { path: '/login' },
  REGISTER: { path: '/register' },
  FORGOT_PASSWORD: { path: '/forgot-password' },
  RESET_PASSWORD: { path: '/reset-password' }
} as const;

export default routes;
