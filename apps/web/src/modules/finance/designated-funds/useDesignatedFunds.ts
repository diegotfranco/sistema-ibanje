import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { DesignatedFundResponse, DesignatedFundFormValues } from './schema';

const BASE = '/designated-funds';
const KEY = ['designated-funds'] as const;

export function useDesignatedFunds({
  page,
  status
}: { page?: number; status?: 'ativo' | 'inativo' } = {}) {
  return useResourceList<DesignatedFundResponse>(BASE, KEY, {
    page: page ?? 1,
    limit: 20,
    ...(status && { status })
  });
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
