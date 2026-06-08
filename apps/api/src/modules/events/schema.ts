import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListEventsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  // Reference-data list used to populate "load-everything" pickers (income/expense entry forms request
  // limit=200), so it shares the 500 cap of the other reference lists (campaigns, categories,
  // payment-methods) rather than the 100 cap of transactional lists.
  limit: z.coerce.number().int().positive().max(500).default(20),
  status: z.enum(['ativo', 'inativo']).optional()
});

export const CreateEventRequestSchema = z
  .object({
    title: z.string().min(2).max(128),
    description: z.string().max(2000).optional(),
    location: z.string().max(128).optional(),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true })
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'endTime deve ser maior que startTime',
    path: ['endTime']
  });

export const UpdateEventRequestSchema = z
  .object({
    title: z.string().min(2).max(128).optional(),
    description: z.string().max(2000).nullable().optional(),
    location: z.string().max(128).nullable().optional(),
    startTime: z.iso.datetime({ offset: true }).optional(),
    endTime: z.iso.datetime({ offset: true }).optional()
  })
  .refine(
    (data) => !data.startTime || !data.endTime || new Date(data.endTime) > new Date(data.startTime),
    { message: 'endTime deve ser maior que startTime', path: ['endTime'] }
  );

export const EventResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const EventListResponseSchema = paginatedSchema(EventResponseSchema);

export type ListEventsRequest = z.infer<typeof ListEventsRequestSchema>;
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type UpdateEventRequest = z.infer<typeof UpdateEventRequestSchema>;
export type EventResponse = z.infer<typeof EventResponseSchema>;
