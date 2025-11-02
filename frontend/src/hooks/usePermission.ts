import { useAuthStore } from '@/stores/useAuthStore';
import { module, action } from '@/enums/permission.enum';

export function usePermission() {
  const { can, hasRole, user } = useAuthStore();
  return { can, hasRole, user, module, action };
}
