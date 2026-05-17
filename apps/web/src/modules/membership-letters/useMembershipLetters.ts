import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type {
  MembershipLetterFormValues,
  MembershipLetterResponse
} from '@/schemas/membership-letter';

const BASE = '/membership-letters';
const KEY = ['membership-letters'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

interface ListFilters {
  page?: number;
  limit?: number;
  attenderId?: number | null;
  type?: string | null;
}

export function useMembershipLetters(filters?: ListFilters) {
  return useQuery({
    queryKey: [
      ...KEY,
      filters?.page ?? null,
      filters?.limit ?? null,
      filters?.attenderId ?? null,
      filters?.type ?? null
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.attenderId) params.append('attenderId', String(filters.attenderId));
      if (filters?.type) params.append('type', filters.type);
      const query = params.toString();
      return api.get<{
        data: MembershipLetterResponse[];
        total: number;
        page: number;
        limit: number;
      }>(`${BASE}${query ? `?${query}` : ''}`);
    }
  });
}

export function useMembershipLetterById(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get<MembershipLetterResponse>(`${BASE}/${id}`),
    enabled: id != null
  });
}

export function useCreateMembershipLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MembershipLetterFormValues) =>
      api.post<MembershipLetterResponse>(BASE, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Carta de transferência cadastrada.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao cadastrar carta.'))
  });
}

export function useUpdateMembershipLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<MembershipLetterFormValues> }) =>
      api.patch<MembershipLetterResponse>(`${BASE}/${id}`, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, id] });
      toast.success('Carta de transferência atualizada.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao atualizar carta.'))
  });
}

export function useDeleteMembershipLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Carta de transferência removida.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover carta.'))
  });
}

export function useRenderedMembershipLetter(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, id, 'rendered'],
    queryFn: () => api.getText(`${BASE}/${id}/render`),
    enabled: enabled && id != null
  });
}
