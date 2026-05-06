import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type {
  ExpenseCategoryResponse,
  ExpenseCategoryFormValues
} from '@/schemas/expense-category';

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
