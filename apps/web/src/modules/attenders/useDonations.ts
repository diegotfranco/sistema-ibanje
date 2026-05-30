import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

export interface DonationGroup {
  categoryName: string;
  fundName: string | null;
  eventName: string | null;
  total: string;
}

export interface DonationMonth {
  month: string;
  label: string;
  total: string;
  groups: DonationGroup[];
}

export interface AttenderDonationsSummary {
  year: number;
  availableYears: number[];
  months: DonationMonth[];
  grandTotal: string;
}

export interface DonationEntry {
  id: number;
  depositDate: string;
  categoryName: string;
  fundName: string | null;
  eventName: string | null;
  paymentMethodName: string;
  amount: string;
}

export interface AttenderDonationsEntries {
  month: string;
  label: string;
  entries: DonationEntry[];
  total: string;
}

function noRetryOnAuthOr404(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
    return false;
  }
  return failureCount < 3;
}

export function useAttenderDonationsSummary(attenderId: number | null, year?: number) {
  return useQuery({
    queryKey: ['attenders', attenderId, 'donations', 'summary', year ?? 'default'],
    queryFn: () =>
      api.get<AttenderDonationsSummary>(
        `/attenders/${attenderId}/donations/summary${year ? `?year=${year}` : ''}`
      ),
    enabled: attenderId != null,
    retry: noRetryOnAuthOr404
  });
}

export function useAttenderDonationsEntries(
  attenderId: number | null,
  month: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['attenders', attenderId, 'donations', 'entries', month],
    queryFn: () =>
      api.get<AttenderDonationsEntries>(
        `/attenders/${attenderId}/donations/entries?month=${month}`
      ),
    enabled: enabled && attenderId != null,
    retry: noRetryOnAuthOr404
  });
}
