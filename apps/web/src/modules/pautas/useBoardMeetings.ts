import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { BoardMeetingFormValues, BoardMeetingResponse } from '@/schemas/board-meeting';

const BASE = '/board-meetings';
const KEY = ['board-meetings'] as const;

export function useBoardMeetings() {
  return useResourceList<BoardMeetingResponse>(BASE, KEY);
}

export function useBoardMeetingMutations() {
  return useResourceMutations<
    BoardMeetingResponse,
    BoardMeetingFormValues,
    Partial<BoardMeetingFormValues>
  >(BASE, KEY, {
    created: 'Reunião cadastrada.',
    updated: 'Reunião atualizada.',
    removed: 'Reunião removida.'
  });
}

export function useSetAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: number; items: string[] }) =>
      api.put<BoardMeetingResponse>(`${BASE}/${id}/agenda`, { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      toast.success('Pauta salva.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar pauta.')
  });
}
