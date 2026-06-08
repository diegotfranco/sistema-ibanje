import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, rateLimitMessage } from '@/lib/api';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { CampaignStatusValue } from '@sistema-ibanje/shared';
import type { DeletedFilter } from '@/lib/status';
import type { CampaignResponse, CampaignFormValues } from './schema';

const BASE = '/campaigns';
const KEY = ['campaigns'] as const;

export function useCampaigns({
  page,
  limit,
  status,
  deleted
}: {
  page?: number;
  limit?: number;
  status?: CampaignStatusValue;
  deleted?: DeletedFilter;
} = {}) {
  return useResourceList<CampaignResponse>(BASE, KEY, {
    page: page ?? 1,
    limit: limit ?? 20,
    ...(status && { status }),
    ...(deleted && { deleted })
  });
}

export function useCampaignMutations() {
  const base = useResourceMutations<
    CampaignResponse,
    CampaignFormValues,
    Partial<CampaignFormValues>
  >(BASE, KEY, {
    created: 'Campanha criada.',
    updated: 'Campanha atualizada.',
    removed: 'Campanha removida.',
    restored: 'Campanha restaurada.'
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
  // `reabrir` reopens it. Both flip `campaignStatus` (ativa ↔ encerrada).
  const encerrar = useMutation({
    mutationFn: (id: number) => api.patch<CampaignResponse>(`${BASE}/${id}/encerrar`),
    onSuccess: () => {
      invalidate();
      toast.success('Campanha encerrada.');
    },
    onError: onError('Erro ao encerrar campanha.')
  });

  const reabrir = useMutation({
    mutationFn: (id: number) => api.patch<CampaignResponse>(`${BASE}/${id}/reabrir`),
    onSuccess: () => {
      invalidate();
      toast.success('Campanha reaberta.');
    },
    onError: onError('Erro ao reabrir campanha.')
  });

  return { ...base, encerrar, reabrir };
}
