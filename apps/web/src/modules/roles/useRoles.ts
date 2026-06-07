import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { DeletedFilter } from '@/lib/status';
import type { RoleFormValues, RolePermissionEntry, RoleResponse } from './schema';

const BASE = '/roles';
const KEY = ['roles'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useRoles({ deleted }: { deleted?: DeletedFilter } = {}) {
  return useResourceList<RoleResponse>(BASE, KEY, { ...(deleted && { deleted }) });
}

export function useRoleMutations() {
  // The shared hook supplies create/update/remove/restore with correct cache invalidation
  // (keyed by [basePath, ...KEY]); restore hits PATCH /roles/:id/restore.
  return useResourceMutations<RoleResponse, RoleFormValues, Partial<RoleFormValues>>(BASE, KEY, {
    created: 'Cargo cadastrado.',
    updated: 'Cargo atualizado.',
    removed: 'Cargo removido.',
    restored: 'Cargo restaurado.'
  });
}

export function useRolePermissions(roleId: number | null) {
  return useQuery({
    queryKey: [...KEY, roleId, 'permissions'],
    queryFn: () => api.get<RolePermissionEntry[]>(`${BASE}/${roleId}/permissions`),
    enabled: roleId !== null
  });
}

export function useSaveRolePermissions(roleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissions: { moduleId: number; permissionId: number }[]) =>
      api.put(`${BASE}/${roleId}/permissions`, { permissions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, roleId, 'permissions'] });
      toast.success('Permissões salvas.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao salvar permissões.'))
  });
}
