import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useResourceList } from '@/lib/resourceQuery';
import type { UserCreateFormValues, UserEditFormValues, UserResponse } from '@/schemas/user';

const BASE = '/users';
const KEY = ['users'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useUsers() {
  return useResourceList<UserResponse>(BASE, KEY);
}

export function useUserMutations(currentUserId: number | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (body: UserCreateFormValues) => api.post<UserResponse>(BASE, body),
    onSuccess: () => {
      invalidate();
      toast.success('Usuário cadastrado. Aguarda aprovação.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao cadastrar usuário.'))
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UserEditFormValues }) =>
      api.patch<UserResponse>(`${BASE}/${id}`, body),
    onSuccess: () => {
      invalidate();
      toast.success('Usuário atualizado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar usuário.'))
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Usuário removido.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover usuário.'))
  });

  const approve = useMutation({
    mutationFn: (id: number) => api.patch<UserResponse>(`${BASE}/${id}/approve`),
    onSuccess: () => {
      invalidate();
      toast.success('Usuário aprovado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao aprovar usuário.'))
  });

  const isSelf = (id: number) => id === currentUserId;

  return { create, update, remove, approve, isSelf };
}

export function useUserPermissions(userId: number | null) {
  return useQuery({
    queryKey: [...KEY, userId, 'permissions'],
    queryFn: () => api.get<Record<string, string[]>>(`${BASE}/${userId}/permissions`),
    enabled: userId !== null
  });
}

export function useSaveUserPermissions(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissions: Record<string, string[]>) =>
      api.put(`${BASE}/${userId}/permissions`, { permissions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, userId, 'permissions'] });
      toast.success('Permissões salvas.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao salvar permissões.'))
  });
}
