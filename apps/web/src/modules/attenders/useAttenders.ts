import { useQuery } from '@tanstack/react-query';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import { api } from '@/lib/api';
import type { AttenderFormValues, AttenderResponse } from './schema';

const BASE = '/attenders';
const KEY = ['attenders'] as const;

export function useAttenders(
  params: {
    page?: number;
    isMember?: 'true' | 'false';
    status?: 'ativo' | 'inativo';
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
