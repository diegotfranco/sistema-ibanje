import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type {
  IncomeReportResponse,
  ExpenseReportResponse,
  FinancialStatementResponse,
  DetailedFinancialStatementResponse,
  MembersReportResponse,
  FundListResponse,
  FundDetailResponse
} from '@/schemas/report';

function buildParams(from: string, to: string, page?: number, limit?: number) {
  const p = new URLSearchParams({ from, to });
  if (page !== undefined) p.set('page', String(page));
  if (limit !== undefined) p.set('limit', String(limit));
  return p.toString();
}

const enabled = (from: string, to: string) => from.length > 0 && to.length > 0;

export function useIncomeReport(from: string, to: string, page = 1) {
  return useQuery({
    queryKey: ['reports', 'income', from, to, page],
    queryFn: () =>
      api.get<IncomeReportResponse>(`/reports/income?${buildParams(from, to, page, 50)}`),
    enabled: enabled(from, to)
  });
}

export function useExpenseReport(from: string, to: string, page = 1) {
  return useQuery({
    queryKey: ['reports', 'expenses', from, to, page],
    queryFn: () =>
      api.get<ExpenseReportResponse>(`/reports/expenses?${buildParams(from, to, page, 50)}`),
    enabled: enabled(from, to)
  });
}

export function useFinancialStatement(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'statement', from, to],
    queryFn: () =>
      api.get<FinancialStatementResponse>(`/reports/financial-statement?${buildParams(from, to)}`),
    enabled: enabled(from, to)
  });
}

export function useDetailedStatement(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'statement-detailed', from, to],
    queryFn: () =>
      api.get<DetailedFinancialStatementResponse>(
        `/reports/financial-statement/detailed?${buildParams(from, to)}`
      ),
    enabled: enabled(from, to)
  });
}

export function useMembersReport(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'members', from, to],
    queryFn: () => api.get<MembersReportResponse>(`/reports/members?${buildParams(from, to)}`),
    enabled: enabled(from, to)
  });
}

export function useFundsReport(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'funds', from, to],
    queryFn: () => api.get<FundListResponse>(`/reports/funds?${buildParams(from, to)}`),
    enabled: enabled(from, to)
  });
}

export function useFundDetail(id: number, from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'fund', id, from, to],
    queryFn: () => api.get<FundDetailResponse>(`/reports/funds/${id}?${buildParams(from, to)}`),
    enabled: enabled(from, to) && id > 0
  });
}

export function usePdfDownload() {
  return useMutation({
    mutationFn: async (path: string) => {
      const blob = await api.getBlob(path);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
    onError: () => toast.error('Erro ao baixar PDF.')
  });
}
