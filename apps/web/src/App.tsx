import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import routes from '@/enums/routes.enum';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path={routes.LOGIN.path} element={<LoginPage />} />
        <Route path={routes.REGISTER.path} element={<RegisterPage />} />
        <Route path={routes.FORGOT_PASSWORD.path} element={<ForgotPasswordPage />} />
        <Route path={routes.RESET_PASSWORD.path} element={<ResetPasswordPage />} />
        <Route
          path={routes.ROOT.path}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={routes.LOGIN.path} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
