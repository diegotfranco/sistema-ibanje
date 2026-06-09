import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { ChurchSettingsResponse, ChurchSettingsFormValues } from './schema';

const BASE = '/church-settings';
const KEY = ['church-settings'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useChurchSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<ChurchSettingsResponse>(BASE)
  });
}

export function useUpdateChurchSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ChurchSettingsFormValues) => api.put<ChurchSettingsResponse>(BASE, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Configurações atualizadas');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar configurações'))
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<ChurchSettingsResponse>(`${BASE}/logo`, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Logo atualizado');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao enviar o logo'))
  });
}

export function useDeleteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`${BASE}/logo`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Logo removido');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover o logo'))
  });
}
