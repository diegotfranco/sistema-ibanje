import { Navigate } from 'react-router';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { paths } from '@/lib/paths';
import { hasPermission, Action, type Module } from '@/lib/permissions';
import type { Action as ActionType } from '@/lib/permissions';

interface RequirePermissionProps {
  module: Module;
  action?: ActionType;
  children: React.ReactNode;
}

export function RequirePermission({
  module,
  action = Action.View,
  children
}: RequirePermissionProps) {
  const { data: user } = useCurrentUser();

  if (!hasPermission(user?.permissions, module, action)) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <>{children}</>;
}
