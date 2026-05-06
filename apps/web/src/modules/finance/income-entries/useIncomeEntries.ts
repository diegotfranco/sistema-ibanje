import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type {
  IncomeEntryResponse,
  IncomeEntryCreateBody,
  IncomeEntryUpdateBody
} from '@/schemas/income-entry';

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
