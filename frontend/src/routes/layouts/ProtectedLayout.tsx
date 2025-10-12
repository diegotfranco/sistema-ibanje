import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePermission } from '@/hooks/usePermission';

type ProtectedLayoutProps = {
  children: ReactNode;
  area: number;
  acao: number;
};

export const ProtectedLayout = ({ children, area, acao }: ProtectedLayoutProps) => {
  const { isAuthenticated } = useAuthStore();
  const { can } = usePermission();
  const location = useLocation();

  // 🔒 1. User not logged in
  if (!isAuthenticated()) {
    // Preserve where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🚫 2. User logged in but lacks permission
  if (!can(area, acao)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ 3. Authorized — show content
  return <>{children}</>;
};
