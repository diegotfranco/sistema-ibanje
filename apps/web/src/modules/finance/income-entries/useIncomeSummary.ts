import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type IncomeSummaryRow = { categoryId: number; categoryName: string; total: string };
export type IncomeSummaryResponse = {
  rows: IncomeSummaryRow[];
  total: string;
  totalExpense: string;
};

export function useIncomeSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['income-entries', 'summary', from, to],
    queryFn: () => api.get<IncomeSummaryResponse>(`/income-entries/summary?from=${from}&to=${to}`),
    enabled: from.length > 0 && to.length > 0
  });
}
