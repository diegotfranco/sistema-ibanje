import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import { api } from '@/lib/api';
import type { AttenderStatusValue } from '@sistema-ibanje/shared';
import type { AttenderFormValues, AttenderResponse, AttenderStatusChangeValues } from './schema';

const BASE = '/attenders';
const KEY = ['attenders'] as const;

export function useAttenders(
  params: {
    page?: number;
    isMember?: 'true' | 'false';
    status?: AttenderStatusValue;
    q?: string;
  } = {}
) {
  return useResourceList<AttenderResponse>(BASE, KEY, {
    page: params.page ?? 1,
    ...(params.isMember !== undefined && { isMember: params.isMember }),
    ...(params.status !== undefined && { status: params.status }),
    ...(params.q && { q: params.q })
  });
}

// Full attender record by id. The server returns the complete AttenderResponse here and
// authorizes self-or-staff; a congregant fetching someone else's id gets 404. Shares the
// query cache key with useAttenderProfile (same endpoint and payload).
export function useAttender(attenderId: number | null) {
  return useQuery({
    queryKey: [...KEY, attenderId, 'profile'],
    queryFn: () => api.get<AttenderResponse>(`${BASE}/${attenderId}`),
    enabled: attenderId != null
  });
}

export function useAttenderMutations() {
  return useResourceMutations<AttenderResponse, AttenderFormValues, Partial<AttenderFormValues>>(
    BASE,
    KEY,
    {
      created: 'Congregado cadastrado.',
      updated: 'Congregado atualizado.',
      removed: 'Congregado removido.'
    }
  );
}

// Lifecycle transition (desligamento, transferência, óbito, reativação). Separate from the
// generic update — it hits the guarded PATCH /attenders/:id/status endpoint.
export function useChangeAttenderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AttenderStatusChangeValues }) =>
      api.patch<AttenderResponse>(`${BASE}/${id}/status`, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, updated.id, 'profile'] });
      toast.success('Situação do congregado atualizada.');
    }
  });
}
