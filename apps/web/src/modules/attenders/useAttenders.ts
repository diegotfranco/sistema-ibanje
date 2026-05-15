import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type { AttenderFormValues, AttenderResponse } from '@/schemas/attender';

const BASE = '/attenders';
const KEY = ['attenders'] as const;

export function useAttenders() {
  return useResourceList<AttenderResponse>(BASE, KEY);
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
