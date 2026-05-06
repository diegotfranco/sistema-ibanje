import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResourceList } from '@/lib/resourceQuery';
import { api, ApiError } from '@/lib/api';
import type { MonthlyClosingResponse, NewClosingFormValues } from '@/schemas/monthly-closing';

const BASE = '/monthly-closings';
const KEY = ['monthly-closings'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useMonthlyClosings() {
  return useResourceList<MonthlyClosingResponse>(BASE, KEY);
}

export function useMonthlyClosingById(id: number) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get<MonthlyClosingResponse>(`${BASE}/${id}`)
  });
}

export function useCreateMonthlyClosing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NewClosingFormValues) => api.post<MonthlyClosingResponse>(BASE, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Fechamento criado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao criar fechamento.'))
  });
}

export function useRemoveMonthlyClosing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Fechamento removido.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover fechamento.'))
  });
}

const TRANSITION_LABELS: Record<string, string> = {
  submit: 'Fechamento submetido para revisão.',
  approve: 'Fechamento aprovado.',
  reject: 'Fechamento rejeitado.',
  close: 'Período fechado com sucesso.'
};

export function useClosingTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: number; action: string; notes?: string }) => {
      const notesKey = action === 'submit' ? 'treasurerNotes' : 'accountantNotes';
      const body = notes ? { [notesKey]: notes } : undefined;
      return api.post<MonthlyClosingResponse>(`${BASE}/${id}/${action}`, body);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(TRANSITION_LABELS[vars.action] ?? 'Ação concluída.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao processar ação.'))
  });
}
