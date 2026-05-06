import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import LoginPage from '@/modules/auth/LoginPage';
import RegisterPage from '@/modules/auth/RegisterPage';
import ForgotPasswordPage from '@/modules/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/modules/auth/ResetPasswordPage';

export const authRoutes: AppRoute[] = [
  { path: paths.login, element: <LoginPage />, layout: 'auth' },
  { path: paths.register, element: <RegisterPage />, layout: 'auth' },
  { path: paths.forgotPassword, element: <ForgotPasswordPage />, layout: 'auth' },
  { path: paths.resetPassword, element: <ResetPasswordPage />, layout: 'auth' }
];
