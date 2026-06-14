import type { QueryClient } from '@tanstack/react-query';

// Cross-resource finance aggregates. Any income/expense entry, campaign, event, or monthly-closing
// mutation changes numbers that these derived views recompute, but they live under their own query
// keys (not the mutated resource's), so a resource-scoped invalidation never reaches them. Every
// finance mutation funnels through `invalidateFinanceDerived` so these refetch together.
//
// Both summary keys are listed because the income/expense summary endpoint returns *both* totals
// (the income "Total do mês" card shows Saídas too), so an expense edit must refresh the income
// card and vice-versa.
export const FINANCE_DERIVED_KEYS = [
  ['reports'],
  ['dashboard'],
  ['income-entries', 'summary'],
  ['expense-entries', 'summary']
] as const;

export function invalidateFinanceDerived(qc: QueryClient): void {
  for (const key of FINANCE_DERIVED_KEYS) qc.invalidateQueries({ queryKey: [...key] });
}
