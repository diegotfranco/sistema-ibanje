import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardResponse } from '@sistema-ibanje/shared';

export function useDashboard(month: string) {
  return useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => api.get<DashboardResponse>(`/dashboard?month=${month}`),
    staleTime: 60_000,
    enabled: month.length > 0
  });
}
