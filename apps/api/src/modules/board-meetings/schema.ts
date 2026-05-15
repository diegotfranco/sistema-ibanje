import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListBoardMeetingsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateBoardMeetingRequestSchema = z.object({
  meetingDate: z.string().date(),
  type: z.enum(['ordinária', 'extraordinária']),
  isPublic: z.boolean().default(false)
});

export const UpdateBoardMeetingRequestSchema = z.object({
  meetingDate: z.string().date().optional(),
  type: z.enum(['ordinária', 'extraordinária']).optional(),
  isPublic: z.boolean().optional()
});

export const AgendaItemInputSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional()
});

export const SetAgendaItemsRequestSchema = z.object({
  items: z.array(AgendaItemInputSchema).min(1).max(50)
});

export const AgendaItemResponseSchema = z.object({
  id: z.number().int().positive(),
  meetingId: z.number().int().positive(),
  order: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  createdByUserId: z.number().int().positive().nullable(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const BoardMeetingResponseSchema = z.object({
  id: z.number().int().positive(),
  meetingDate: z.string(),
  type: z.enum(['ordinária', 'extraordinária']),
  agendaItems: z.array(AgendaItemResponseSchema),
  isPublic: z.boolean(),
  status: z.string(),
  hasMinutes: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const BoardMeetingListResponseSchema = paginatedSchema(BoardMeetingResponseSchema);

export type CreateBoardMeetingRequest = z.infer<typeof CreateBoardMeetingRequestSchema>;
export type UpdateBoardMeetingRequest = z.infer<typeof UpdateBoardMeetingRequestSchema>;
export type SetAgendaItemsRequest = z.infer<typeof SetAgendaItemsRequestSchema>;
export type AgendaItemResponse = z.infer<typeof AgendaItemResponseSchema>;
export type BoardMeetingResponse = z.infer<typeof BoardMeetingResponseSchema>;
