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

function buildParams(month: string, page?: number, limit?: number) {
  const p = new URLSearchParams({ month });
  if (page !== undefined) p.set('page', String(page));
  if (limit !== undefined) p.set('limit', String(limit));
  return p.toString();
}

function buildParamsOptional(month: string | undefined, page?: number, limit?: number) {
  const p = new URLSearchParams();
  if (month) p.set('month', month);
  if (page !== undefined) p.set('page', String(page));
  if (limit !== undefined) p.set('limit', String(limit));
  return p.toString();
}

const enabled = (month: string) => month.length > 0;

export function useIncomeReport(month: string, page = 1) {
  return useQuery({
    queryKey: ['reports', 'income', month, page],
    queryFn: () => api.get<IncomeReportResponse>(`/reports/income?${buildParams(month, page, 50)}`),
    enabled: enabled(month)
  });
}

export function useExpenseReport(month: string, page = 1) {
  return useQuery({
    queryKey: ['reports', 'expenses', month, page],
    queryFn: () =>
      api.get<ExpenseReportResponse>(`/reports/expenses?${buildParams(month, page, 50)}`),
    enabled: enabled(month)
  });
}

export function useFinancialStatement(month: string) {
  return useQuery({
    queryKey: ['reports', 'statement', month],
    queryFn: () =>
      api.get<FinancialStatementResponse>(`/reports/financial-statement?${buildParams(month)}`),
    enabled: enabled(month)
  });
}

export function useDetailedStatement(month: string) {
  return useQuery({
    queryKey: ['reports', 'statement-detailed', month],
    queryFn: () =>
      api.get<DetailedFinancialStatementResponse>(
        `/reports/financial-statement/detailed?${buildParams(month)}`
      ),
    enabled: enabled(month)
  });
}

export function useMembersReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'members', month],
    queryFn: () => api.get<MembersReportResponse>(`/reports/members?${buildParams(month)}`),
    enabled: enabled(month)
  });
}

export function useFundsReport(month?: string) {
  return useQuery({
    queryKey: ['reports', 'funds', month],
    queryFn: () => api.get<FundListResponse>(`/reports/funds?${buildParamsOptional(month)}`),
    enabled: true
  });
}

export function useFundDetail(id: number, month?: string) {
  return useQuery({
    queryKey: ['reports', 'fund', id, month],
    queryFn: () =>
      api.get<FundDetailResponse>(`/reports/funds/${id}?${buildParamsOptional(month)}`),
    enabled: id > 0
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
