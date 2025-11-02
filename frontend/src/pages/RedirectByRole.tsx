import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore'; // adjust path to your store
import routesEnum from '@/enums/routes.enum';
import { role } from '@/enums/role.enum';

export default function RedirectByRole() {
  const user = useAuthStore((s) => s.user);
  if (!user) return;

  if (user.role === role.MEMBER) return <Navigate to={routesEnum.MEMBERS.path} replace />;

  return <Navigate to={routesEnum.DASHBOARD.path} replace />;
}
