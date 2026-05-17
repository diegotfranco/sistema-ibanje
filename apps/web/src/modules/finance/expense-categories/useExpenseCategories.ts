import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { ExpenseCategoryResponse, ExpenseCategoryFormValues } from './schema';

const BASE = '/expense-categories';
const KEY = ['expense-categories'] as const;

export function useExpenseCategories() {
  return useResourceList<ExpenseCategoryResponse>(BASE, KEY);
}

export function useExpenseCategoryMutations() {
  return useResourceMutations<
    ExpenseCategoryResponse,
    ExpenseCategoryFormValues,
    Partial<ExpenseCategoryFormValues>
  >(BASE, KEY, {
    created: 'Categoria criada.',
    updated: 'Categoria atualizada.',
    removed: 'Categoria removida.'
  });
}
