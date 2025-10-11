// components/RequirePermission.tsx

import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

type Props = {
  area: number;
  acao: number;
  fallback?: ReactNode;
  children: ReactNode;
};

export function RequirePermission({ area, acao, fallback = null, children }: Props) {
  const { can } = usePermission();
  return can(area, acao) ? <>{children}</> : <>{fallback}</>;
}
