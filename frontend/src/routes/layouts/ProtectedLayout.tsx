import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Navigate } from 'react-router';

interface ProtectedLayoutProps {
  children: ReactNode;
  area: number;
  acao: number;
}

export const ProtectedLayout = ({ children, area, acao }: ProtectedLayoutProps) => {
  const { can } = usePermission();
  return can(area, acao) ? <>{children}</> : <Navigate to="/unauthorized" replace />;
};
