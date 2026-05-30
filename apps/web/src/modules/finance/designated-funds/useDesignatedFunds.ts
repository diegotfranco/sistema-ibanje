import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, rateLimitMessage } from '@/lib/api';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { DesignatedFundResponse, DesignatedFundFormValues } from './schema';

const BASE = '/designated-funds';
const KEY = ['designated-funds'] as const;

export function useDesignatedFunds({
  page,
  limit,
  status
}: { page?: number; limit?: number; status?: 'ativo' | 'inativo' } = {}) {
  return useResourceList<DesignatedFundResponse>(BASE, KEY, {
    page: page ?? 1,
    limit: limit ?? 20,
    ...(status && { status })
  });
}

export function useDesignatedFundMutations() {
  const base = useResourceMutations<
    DesignatedFundResponse,
    DesignatedFundFormValues,
    Partial<DesignatedFundFormValues>
  >(BASE, KEY, {
    created: 'Fundo criado.',
    updated: 'Fundo atualizado.',
    removed: 'Fundo removido.'
  });

  // Reverse of the soft-delete. Kept local (not in the generic hook) since funds
  // are the only resource that exposes a restore today.
  const qc = useQueryClient();
  const restore = useMutation({
    mutationFn: (id: number) => api.patch<DesignatedFundResponse>(`${BASE}/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      toast.success('Fundo restaurado.');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.status === 429 ? rateLimitMessage(err) : err.message);
      } else {
        toast.error('Erro ao restaurar.');
      }
    }
  });

  return { ...base, restore };
}
