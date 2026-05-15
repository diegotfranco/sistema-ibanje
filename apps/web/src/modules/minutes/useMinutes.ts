import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResourceList } from '@/lib/resourceQuery';
import { api, ApiError } from '@/lib/api';
import type {
  MinuteFormValues,
  UpdateMinuteValues,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      toast.success('Ata cadastrada.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao cadastrar ata.'))
  });
}

export function useSuggestedMinuteNumber(enabled: boolean) {
  return useQuery({
    queryKey: [BASE, ...KEY, 'suggested-number'],
    queryFn: () => api.get<{ value: string }>(`${BASE}/suggested-number`),
    enabled,
    staleTime: 0
  });
}

export function useMeetingAttendersPresent(meetingId: number | null) {
  return useQuery({
    queryKey: [BASE, ...KEY, 'meeting-attenders', meetingId],
    queryFn: () =>
      api.get<{ data: { id: number; name: string }[] }>(
        `${BASE}/meetings/${meetingId}/attenders-present`
      ),
    enabled: meetingId != null
  });
}

export function useSetMeetingAttendersPresent(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attenderIds: number[]) =>
      api.put(`${BASE}/meetings/${meetingId}/attenders-present`, { attenderIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, 'meeting-attenders', meetingId] });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      toast.success('Membros presentes atualizados.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar membros presentes.'))
  });
}

export function useUpdatePendingVersion(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: unknown }) =>
      api.patch<MinuteResponse>(`${BASE}/${minuteId}/pending`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, minuteId] });
      toast.success('Rascunho atualizado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar rascunho.'))
  });
}

export function useEditApprovedMinute(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EditApprovedMinuteValues) =>
      api.post<MinuteResponse>(`${BASE}/${minuteId}/edit-approved`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, minuteId] });
      toast.success('Nova versão criada.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao criar nova versão.'))
  });
}

export function useApproveMinute(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApproveMinuteValues) =>
      api.post<MinuteResponse>(`${BASE}/${minuteId}/approve`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, minuteId] });
      toast.success('Ata aprovada.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao aprovar ata.'))
  });
}

export function useDeleteMinute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      toast.success('Ata removida.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover ata.'))
  });
}

export function useFinalizeDraft(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<MinuteResponse>(`${BASE}/${minuteId}/finalize-draft`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, minuteId] });
      toast.success('Rascunho finalizado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao finalizar rascunho.'))
  });
}

export function useUpdateMinute(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMinuteValues) =>
      api.patch<MinuteResponse>(`${BASE}/${minuteId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, minuteId] });
      toast.success('Detalhes atualizados.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar detalhes.'))
  });
}

export function useSignMinute(minuteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<MinuteResponse>(`${BASE}/${minuteId}/sign`, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, minuteId] });
      toast.success('Documento assinado enviado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao enviar documento.'))
  });
}
