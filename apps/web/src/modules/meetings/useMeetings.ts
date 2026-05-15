import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { AgendaItemInput, MeetingFormValues, MeetingResponse } from '@/schemas/meeting';

const BASE = '/meetings';
const KEY = ['meetings'] as const;

export function useMeetings() {
  return useResourceList<MeetingResponse>(BASE, KEY);
}

export function useMeetingMutations() {
  return useResourceMutations<MeetingResponse, MeetingFormValues, Partial<MeetingFormValues>>(
    BASE,
    KEY,
    {
      created: 'Reunião cadastrada.',
      updated: 'Reunião atualizada.',
      removed: 'Reunião removida.'
    }
  );
}

export function useSetAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: number; items: AgendaItemInput[] }) =>
      api.put<MeetingResponse>(`${BASE}/${id}/agenda-items`, { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, ...KEY] });
      toast.success('Pauta salva.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar pauta.')
  });
}
