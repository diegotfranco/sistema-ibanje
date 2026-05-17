import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { IncomeEntryResponse, IncomeEntryCreateBody, IncomeEntryUpdateBody } from './schema';

const BASE = '/income-entries';
const KEY = ['income-entries'] as const;

export function useIncomeEntries() {
  return useResourceList<IncomeEntryResponse>(BASE, KEY);
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
