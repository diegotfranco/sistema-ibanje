import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResourceList } from '@/lib/resourceQuery';
import { api, ApiError } from '@/lib/api';
import type {
  MinuteFormValues,
  EditApprovedMinuteValues,
  ApproveMinuteValues,
  MinuteResponse
} from '@/schemas/minute';

const BASE = '/minutes';
const KEY = ['minutes'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useMinutes() {
  return useResourceList<MinuteResponse>(BASE, KEY);
}

export function useMinuteById(id: number) {
  return useQuery({
    queryKey: [BASE, ...KEY, id],
    queryFn: () => api.get<MinuteResponse>(`${BASE}/${id}`)
  });
}

export function useCreateMinute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MinuteFormValues) => api.post<MinuteResponse>(BASE, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, ...KEY] }); toast.success('Ata cadastrada.'); },
    onError: (err) => toast.error(describeError(err, 'Erro ao cadastrar ata.'))
  });
}

export function useUpdatePendingVersion(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string }) =>
      api.patch<MinuteResponse>(`${BASE}/${minuteId}/pending`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, ...KEY] }); toast.success('Rascunho atualizado.'); },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar rascunho.'))
  });
}

export function useEditApprovedMinute(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EditApprovedMinuteValues) =>
      api.post<MinuteResponse>(`${BASE}/${minuteId}/edit-approved`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, ...KEY] }); toast.success('Nova versão criada.'); },
    onError: (err) => toast.error(describeError(err, 'Erro ao criar nova versão.'))
  });
}

export function useApproveMinute(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApproveMinuteValues) =>
      api.post<MinuteResponse>(`${BASE}/${minuteId}/approve`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, ...KEY] }); toast.success('Ata aprovada.'); },
    onError: (err) => toast.error(describeError(err, 'Erro ao aprovar ata.'))
  });
}

export function useDeleteMinute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, ...KEY] }); toast.success('Ata removida.'); },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover ata.'))
  });
}
