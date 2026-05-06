import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type { IncomeCategoryResponse, IncomeCategoryFormValues } from '@/schemas/income-category';

const BASE = '/income-categories';
const KEY = ['income-categories'] as const;

export function useIncomeCategories() {
  return useResourceList<IncomeCategoryResponse>(BASE, KEY);
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
