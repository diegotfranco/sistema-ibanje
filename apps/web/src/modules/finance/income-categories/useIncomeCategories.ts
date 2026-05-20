import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { IncomeCategoryResponse, IncomeCategoryFormValues } from './schema';

const BASE = '/income-categories';
const KEY = ['income-categories'] as const;

export function useIncomeCategories(q?: string) {
  return useResourceList<IncomeCategoryResponse>(BASE, KEY, { q });
}

export function useIncomeCategoryMutations() {
  return useResourceMutations<
    IncomeCategoryResponse,
    IncomeCategoryFormValues,
    Partial<IncomeCategoryFormValues>
  >(BASE, KEY, {
    created: 'Categoria criada.',
    updated: 'Categoria atualizada.',
    removed: 'Categoria removida.'
  });
}
