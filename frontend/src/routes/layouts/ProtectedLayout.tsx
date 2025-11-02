import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePermission } from '@/hooks/usePermission';

type ProtectedLayoutProps = {
  children: ReactNode;
  module: number;
  action: number;
};

export const ProtectedLayout = ({ children, module, action }: ProtectedLayoutProps) => {
  const { isAuthenticated } = useAuthStore();
  const { can } = usePermission();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!can(module, action)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
