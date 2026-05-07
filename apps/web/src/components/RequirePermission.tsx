import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { hasPermission, Action, type Module } from '@/lib/permissions';
import type { Action as ActionType } from '@/lib/permissions';
import { UnauthorizedPage } from '@/components/status/UnauthorizedPage';

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
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}
