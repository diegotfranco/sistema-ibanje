import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { IncomeCategoryResponse, IncomeCategoryFormValues } from './schema';

const BASE = '/income-categories';
const KEY = ['income-categories'] as const;

export function useIncomeCategories(q?: string) {
  // Bumped above default 30 because the page lists every category (paginated by
  // parent group in the UI, not by row). Backend cap raised to 500 to match.
  return useResourceList<IncomeCategoryResponse>(BASE, KEY, { q, limit: 200 });
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
