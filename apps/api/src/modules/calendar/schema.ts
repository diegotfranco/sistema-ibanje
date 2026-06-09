import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';
import { trimmedString } from '../../lib/normalize.js';

export const ListCalendarEntriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ativo', 'inativo']).optional()
});

export const CreateCalendarEntryRequestSchema = z.object({
  title: trimmedString(128, 2),
  date: z.iso.date(),
  notes: trimmedString(2000).optional()
});

export const UpdateCalendarEntryRequestSchema = z.object({
  title: trimmedString(128, 2).optional(),
  date: z.iso.date().optional(),
  notes: trimmedString(2000).nullable().optional()
});

export const CalendarEntryResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  date: z.string(),
  notes: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CalendarEntryListResponseSchema = paginatedSchema(CalendarEntryResponseSchema);

// Visible-range feed: dates the secretary tracks merged with derived attender birthdays/baptism
// anniversaries and finance events. Span is capped so a single request can't expand an unbounded
// number of yearly occurrences.
const MAX_FEED_DAYS = 366;

export const CalendarFeedQuerySchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date()
  })
  .refine((q) => q.to >= q.from, {
    message: 'to deve ser maior ou igual a from',
    path: ['to']
  })
  .refine(
    (q) => {
      const days = (Date.parse(q.to) - Date.parse(q.from)) / 86_400_000;
      return days <= MAX_FEED_DAYS;
    },
    { message: `intervalo não pode exceder ${MAX_FEED_DAYS} dias`, path: ['to'] }
  );

export const CalendarFeedItemSchema = z.object({
  id: z.number().int().positive().nullable(),
  eventId: z.number().int().positive().optional(),
  attenderId: z.number().int().positive().optional(),
  title: z.string(),
  date: z.string(),
  type: z.enum(['lembrete', 'aniversario', 'batismo', 'evento']),
  notes: z.string().nullable().optional()
});

export const CalendarFeedResponseSchema = z.array(CalendarFeedItemSchema);

export type ListCalendarEntriesRequest = z.infer<typeof ListCalendarEntriesRequestSchema>;
export type CreateCalendarEntryRequest = z.infer<typeof CreateCalendarEntryRequestSchema>;
export type UpdateCalendarEntryRequest = z.infer<typeof UpdateCalendarEntryRequestSchema>;
export type CalendarEntryResponse = z.infer<typeof CalendarEntryResponseSchema>;
export type CalendarFeedQuery = z.infer<typeof CalendarFeedQuerySchema>;
export type CalendarFeedItem = z.infer<typeof CalendarFeedItemSchema>;
