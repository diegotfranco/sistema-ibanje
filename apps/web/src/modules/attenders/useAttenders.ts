import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import { api } from '@/lib/api';
import type { AttenderStatusValue } from '@sistema-ibanje/shared';
import type {
  AttenderFormValues,
  AttenderResponse,
  AttenderStatusChangeValues,
  AdmitMemberValues
} from './schema';

const BASE = '/attenders';
const KEY = ['attenders'] as const;

export function useAttenders(
  params: {
    page?: number;
    // Server cap is 100; pass it when a picker needs the whole (small) set, not a page.
    limit?: number;
    isMember?: 'true' | 'false';
    // `inativo` is a pseudo-status the server expands to the union of the exit states.
    status?: AttenderStatusValue | 'inativo';
    deleted?: 'only' | 'include';
    q?: string;
  } = {}
) {
  return useResourceList<AttenderResponse>(BASE, KEY, {
    page: params.page ?? 1,
    ...(params.limit !== undefined && { limit: params.limit }),
    ...(params.isMember !== undefined && { isMember: params.isMember }),
    ...(params.status !== undefined && { status: params.status }),
    ...(params.deleted !== undefined && { deleted: params.deleted }),
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
      removed: 'Congregado removido.',
      restored: 'Congregado restaurado.'
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

// Admission (congregado → membro). Guarded PATCH /attenders/:id/membership — distinct from the
// generic edit, which no longer touches membership. Reverse direction = the status exits.
export function useAdmitMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AdmitMemberValues }) =>
      api.patch<AttenderResponse>(`${BASE}/${id}/membership`, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, updated.id, 'profile'] });
      toast.success('Congregado admitido como membro.');
    }
  });
}
