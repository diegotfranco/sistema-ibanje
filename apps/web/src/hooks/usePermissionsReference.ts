import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ModuleRef = { id: number; name: string };
export type PermissionTypeRef = { id: number; name: string };

export function usePermissionsReference() {
  const modules = useQuery({
    queryKey: ['ref', 'modules'],
    queryFn: () => api.get<ModuleRef[]>('/modules'),
    staleTime: Infinity
  });

  const permissionTypes = useQuery({
    queryKey: ['ref', 'permission-types'],
    queryFn: () => api.get<PermissionTypeRef[]>('/permission-types'),
    staleTime: Infinity
  });

  return {
    modules: modules.data ?? [],
    permissionTypes: permissionTypes.data ?? [],
    isLoading: modules.isLoading || permissionTypes.isLoading
  };
}
