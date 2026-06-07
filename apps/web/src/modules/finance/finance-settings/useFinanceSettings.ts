import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';

const BASE = '/finance-settings';
const KEY = ['finance-settings'] as const;

export type FinanceSettingsResponse = {
  openingBalance: string;
  lockedByClosing: boolean;
  updatedAt: string;
};

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useFinanceSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<FinanceSettingsResponse>(BASE)
  });
}

export function useUpdateOpeningBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (openingBalance: string) =>
      api.put<FinanceSettingsResponse>(BASE, { openingBalance }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Saldo inicial atualizado');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar o saldo inicial'))
  });
}
