import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type { DesignatedFundResponse, DesignatedFundFormValues } from '@/schemas/designated-fund';

const BASE = '/designated-funds';
const KEY = ['designated-funds'] as const;

export function useDesignatedFunds() {
  return useResourceList<DesignatedFundResponse>(BASE, KEY);
}

export function useDesignatedFundMutations() {
  return useResourceMutations<
    DesignatedFundResponse,
    DesignatedFundFormValues,
    Partial<DesignatedFundFormValues>
  >(BASE, KEY, {
    created: 'Fundo criado.',
    updated: 'Fundo atualizado.',
    removed: 'Fundo removido.'
  });
}
