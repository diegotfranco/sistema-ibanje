import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { AttenderProfileResponse, UpdateMyProfileFormValues } from '@/schemas/me';

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useAttenderProfile(attenderId: number | null) {
  return useQuery({
    queryKey: ['attenders', attenderId, 'profile'],
    queryFn: () => api.get<AttenderProfileResponse>(`/attenders/${attenderId}`),
    enabled: attenderId != null
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMyProfileFormValues) => api.patch('/me/profile', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUser'] });
      qc.invalidateQueries({ queryKey: ['attenders'] });
      toast.success('Perfil atualizado com sucesso.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar perfil.'))
  });
}
