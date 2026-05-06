import { Navigate } from 'react-router';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { paths } from '@/lib/paths';
import { hasPermission, Action } from '@/lib/permissions';

interface RequirePermissionProps {
  module: string;
  action?: string;
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
