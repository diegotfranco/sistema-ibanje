import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, rateLimitMessage } from '@/lib/api';

type Paginated<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number };

type ListParams = Record<string, string | number | boolean | undefined>;

function buildQueryString(params: ListParams): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    usp.set(k, String(v));
  }
  return usp.toString();
}

export function useResourceList<T>(
  basePath: string,
  queryKey: readonly unknown[],
  params?: ListParams
) {
  const merged: ListParams = { limit: 30, ...params };
  const qs = buildQueryString(merged);
  return useQuery({
    queryKey: [basePath, ...queryKey, qs],
    queryFn: () => api.get<Paginated<T>>(`${basePath}?${qs}`)
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
  labels: { created: string; updated: string; removed: string; restored?: string }
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

  // Reverse of the soft-delete (`PATCH /:id/restore` clears `deletedAt`). Available on every
  // resource that exposes a trash/restore view; the toast text is overridable per resource.
  const restore = useMutation({
    mutationFn: (id: number) => api.patch<T>(`${basePath}/${id}/restore`),
    onSuccess: () => {
      invalidate();
      toast.success(labels.restored ?? 'Registro restaurado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao restaurar.'))
  });

  return { create, update, remove, restore };
}
