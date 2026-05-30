import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useResourceMutations } from '@/hooks/useResourceQuery';
import type { CalendarFeedResponse } from '@sistema-ibanje/shared';
import type { CalendarEntryResponse, CalendarEntryFormValues } from './schema';

const BASE = '/calendar';
const KEY = ['calendar'] as const;

// Feed key shares the [BASE, ...KEY] prefix so the mutations' invalidateQueries (which targets that
// prefix) also refreshes the merged feed after a create/update/delete.
export function useCalendarFeed(from: string | undefined, to: string | undefined) {
  return useQuery({
    queryKey: [BASE, ...KEY, 'feed', from, to],
    queryFn: () => api.get<CalendarFeedResponse>(`${BASE}/feed?from=${from}&to=${to}`),
    enabled: Boolean(from) && Boolean(to),
    staleTime: 60_000
  });
}

export function useCalendarMutations() {
  return useResourceMutations<
    CalendarEntryResponse,
    CalendarEntryFormValues,
    Partial<CalendarEntryFormValues>
  >(BASE, KEY, {
    created: 'Data adicionada.',
    updated: 'Data atualizada.',
    removed: 'Data removida.'
  });
}
