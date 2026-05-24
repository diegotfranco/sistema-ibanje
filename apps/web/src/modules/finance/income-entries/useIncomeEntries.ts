import { useQuery } from '@tanstack/react-query';
import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import { api } from '@/lib/api';
import type { IncomeEntryResponse, IncomeEntryCreateBody, IncomeEntryUpdateBody } from './schema';

const BASE = '/income-entries';
const KEY = ['income-entries'] as const;

export function useIncomeEntries() {
  return useResourceList<IncomeEntryResponse>(BASE, KEY, { limit: 15 });
}

export function useIncomeEntryById(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get<IncomeEntryResponse>(`${BASE}/${id}`),
    enabled: id !== null && id > 0
  });
}

export function useIncomeEntryMutations() {
  return useResourceMutations<IncomeEntryResponse, IncomeEntryCreateBody, IncomeEntryUpdateBody>(
    BASE,
    KEY,
    {
      created: 'Lançamento criado.',
      updated: 'Lançamento atualizado.',
      removed: 'Lançamento removido.'
    }
  );
}
