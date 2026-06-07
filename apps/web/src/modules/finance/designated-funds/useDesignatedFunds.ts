import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, rateLimitMessage } from '@/lib/api';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { FundStatusValue } from '@sistema-ibanje/shared';
import type { DeletedFilter } from '@/lib/status';
import type { DesignatedFundResponse, DesignatedFundFormValues } from './schema';

const BASE = '/designated-funds';
const KEY = ['designated-funds'] as const;

export function useDesignatedFunds({
  page,
  limit,
  status,
  deleted
}: {
  page?: number;
  limit?: number;
  status?: FundStatusValue;
  deleted?: DeletedFilter;
} = {}) {
  return useResourceList<DesignatedFundResponse>(BASE, KEY, {
    page: page ?? 1,
    limit: limit ?? 20,
    ...(status && { status }),
    ...(deleted && { deleted })
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
    removed: 'Fundo removido.',
    restored: 'Fundo restaurado.'
  });

  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
  const onError = (fallback: string) => (err: unknown) => {
    if (err instanceof ApiError) {
      toast.error(err.status === 429 ? rateLimitMessage(err) : err.message);
    } else {
      toast.error(fallback);
    }
  };

  // Campaign lifecycle — distinct from delete/restore. `encerrar` closes a finished campaign;
  // `reabrir` reopens it. Both flip `fundStatus` (ativa ↔ encerrada).
  const encerrar = useMutation({
    mutationFn: (id: number) => api.patch<DesignatedFundResponse>(`${BASE}/${id}/encerrar`),
    onSuccess: () => {
      invalidate();
      toast.success('Campanha encerrada.');
    },
    onError: onError('Erro ao encerrar campanha.')
  });

  const reabrir = useMutation({
    mutationFn: (id: number) => api.patch<DesignatedFundResponse>(`${BASE}/${id}/reabrir`),
    onSuccess: () => {
      invalidate();
      toast.success('Campanha reaberta.');
    },
    onError: onError('Erro ao reabrir campanha.')
  });

  return { ...base, encerrar, reabrir };
}
