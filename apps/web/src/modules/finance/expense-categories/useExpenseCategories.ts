import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { DeletedFilter } from '@/lib/status';
import type { ExpenseCategoryResponse, ExpenseCategoryFormValues } from './schema';

const BASE = '/expense-categories';
const KEY = ['expense-categories'] as const;

export function useExpenseCategories(q?: string, deleted?: DeletedFilter) {
  // Bumped above default 30 because the page lists every category (paginated by
  // parent group in the UI, not by row). Backend cap raised to 500 to match.
  return useResourceList<ExpenseCategoryResponse>(BASE, KEY, {
    q,
    limit: 200,
    ...(deleted && { deleted })
  });
}

export function useExpenseCategoryMutations() {
  return useResourceMutations<
    ExpenseCategoryResponse,
    ExpenseCategoryFormValues,
    Partial<ExpenseCategoryFormValues>
  >(BASE, KEY, {
    created: 'Categoria criada.',
    updated: 'Categoria atualizada.',
    removed: 'Categoria removida.',
    restored: 'Categoria restaurada.'
  });
}
