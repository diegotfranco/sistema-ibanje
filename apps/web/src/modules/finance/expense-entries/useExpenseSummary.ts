import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ExpenseSummaryRow = { categoryId: number; categoryName: string; total: string };
export type ExpenseSummaryResponse = {
  rows: ExpenseSummaryRow[];
  total: string;
  totalIncome: string;
};

export function useExpenseSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['expense-entries', 'summary', from, to],
    queryFn: () =>
      api.get<ExpenseSummaryResponse>(`/expense-entries/summary?from=${from}&to=${to}`),
    enabled: from.length > 0 && to.length > 0
  });
}
