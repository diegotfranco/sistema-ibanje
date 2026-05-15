import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { MinuteTemplateResponse, MinuteTemplateFormValues } from '@/schemas/minute-template';

const BASE = '/minute-templates';
const KEY = ['minute-templates'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useMinuteTemplates() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<MinuteTemplateResponse[]>(BASE)
  });
}

export function useMinuteTemplateById(id: number) {
  return useQuery({
    queryKey: [BASE, ...KEY, id],
    queryFn: () => api.get<MinuteTemplateResponse>(`${BASE}/${id}`)
  });
}

export function useCreateMinuteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MinuteTemplateFormValues) => api.post<MinuteTemplateResponse>(BASE, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Modelo cadastrado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao cadastrar modelo.'))
  });
}

export function useUpdateMinuteTemplate(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<MinuteTemplateFormValues>) =>
      api.put<MinuteTemplateResponse>(`${BASE}/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [BASE, ...KEY, id] });
      toast.success('Modelo atualizado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar modelo.'))
  });
}

export function useDeleteMinuteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Modelo removido.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover modelo.'))
  });
}
