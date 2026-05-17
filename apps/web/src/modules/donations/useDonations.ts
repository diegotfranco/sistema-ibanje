import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { IncomeEntryResponse } from '@/schemas/donation';

const BASE = '/me/donations';
const KEY = ['me', 'donations'] as const;

interface DonationsResponse {
  data: IncomeEntryResponse[];
  total: number;
  page: number;
  limit: number;
}

export function useMyDonations(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [...KEY, page, limit],
    queryFn: () => api.get<DonationsResponse>(`${BASE}?page=${page}&limit=${limit}`),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

export function useAttenderDonations(
  attenderId: number | null,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['attenders', attenderId, 'donations', page, limit],
    queryFn: () =>
      api.get<DonationsResponse>(`/attenders/${attenderId}/donations?page=${page}&limit=${limit}`),
    enabled: attenderId != null,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });
}
