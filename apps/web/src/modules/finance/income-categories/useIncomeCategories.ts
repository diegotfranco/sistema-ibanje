import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { DeletedFilter } from '@/lib/status';
import type { IncomeCategoryResponse, IncomeCategoryFormValues } from './schema';

const BASE = '/income-categories';
const KEY = ['income-categories'] as const;

export function useIncomeCategories(q?: string, deleted?: DeletedFilter) {
  // Bumped above default 30 because the page lists every category (paginated by
  // parent group in the UI, not by row). Backend cap raised to 500 to match.
  return useResourceList<IncomeCategoryResponse>(BASE, KEY, {
    q,
    limit: 200,
    ...(deleted && { deleted })
  });
}

export function useIncomeCategoryMutations() {
  return useResourceMutations<
    IncomeCategoryResponse,
    IncomeCategoryFormValues,
    Partial<IncomeCategoryFormValues>
  >(BASE, KEY, {
    created: 'Categoria criada.',
    updated: 'Categoria atualizada.',
    removed: 'Categoria removida.',
    restored: 'Categoria restaurada.'
  });
}
