import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, rateLimitMessage } from '@/lib/api';

type Paginated<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number };

export function useResourceList<T>(basePath: string, queryKey: readonly unknown[]) {
  return useQuery({
    queryKey: [basePath, ...queryKey],
    queryFn: () => api.get<Paginated<T>>(`${basePath}?limit=100`)
  });
}

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    if (err.status === 429) return rateLimitMessage(err);
    return err.message || fallback;
  }
  return fallback;
}

export function useResourceMutations<T, C, U>(
  basePath: string,
  queryKey: readonly unknown[],
  labels: { created: string; updated: string; removed: string }
) {
  const qc = useQueryClient();
  const fullKey = [basePath, ...queryKey];
  const invalidate = () => qc.invalidateQueries({ queryKey: fullKey });

  const create = useMutation({
    mutationFn: (body: C) => api.post<T>(basePath, body),
    onSuccess: () => {
      invalidate();
      toast.success(labels.created);
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao salvar.'))
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: U }) => api.patch<T>(`${basePath}/${id}`, body),
    onSuccess: () => {
      invalidate();
      toast.success(labels.updated);
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar.'))
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${basePath}/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success(labels.removed);
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover.'))
  });

  return { create, update, remove };
}
