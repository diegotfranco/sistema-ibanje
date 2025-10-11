// hooks/usePermission.ts
import { useAuthStore } from '@/stores/useAuthStore';
import { AREA, ACAO } from '@/enums/permissionEnum';

export function usePermission() {
  const { can, hasRole, user } = useAuthStore();
  return { can, hasRole, user, AREA, ACAO };
}
