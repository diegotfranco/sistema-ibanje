import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type { RoleFormValues, RolePermissionEntry, RoleResponse } from '@/schemas/role';

const BASE = '/roles';
const KEY = ['roles'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useRoles() {
  return useResourceList<RoleResponse>(BASE, KEY);
}

export function useRoleMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const { create, update } = useResourceMutations<
    RoleResponse,
    RoleFormValues,
    Partial<RoleFormValues>
  >(BASE, KEY, {
    created: 'Cargo cadastrado.',
    updated: 'Cargo atualizado.',
    removed: 'Cargo removido.'
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Cargo removido.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover cargo.'))
  });

  return { create, update, remove };
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
