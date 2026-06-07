import { useResourceList, useResourceMutations } from '@/hooks/useResourceQuery';
import type { EventResponse, EventFormValues } from './schema';

const BASE = '/events';
const KEY = ['events'] as const;

export function useEvents({
  page,
  limit,
  status
}: { page?: number; limit?: number; status?: 'ativo' | 'inativo' } = {}) {
  return useResourceList<EventResponse>(BASE, KEY, {
    page: page ?? 1,
    limit: limit ?? 20,
    ...(status && { status })
  });
}

export function useEventMutations() {
  return useResourceMutations<EventResponse, EventFormValues, Partial<EventFormValues>>(BASE, KEY, {
    created: 'Evento criado.',
    updated: 'Evento atualizado.',
    removed: 'Evento removido.'
  });
}
