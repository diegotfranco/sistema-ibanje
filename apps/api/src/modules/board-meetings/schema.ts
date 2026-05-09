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

export const SetAgendaRequestSchema = z.object({
  items: z.array(z.string().min(1)).min(1)
});

export const BoardMeetingResponseSchema = z.object({
  id: z.number().int().positive(),
  meetingDate: z.string(),
  type: z.enum(['ordinária', 'extraordinária']),
  agendaItems: z.array(z.string()).nullable(),
  agendaAuthorId: z.number().int().positive().nullable(),
  agendaCreatedAt: z.string().nullable(),
  isPublic: z.boolean(),
  status: z.string(),
  hasMinutes: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const BoardMeetingListResponseSchema = paginatedSchema(BoardMeetingResponseSchema);

export type CreateBoardMeetingRequest = z.infer<typeof CreateBoardMeetingRequestSchema>;
export type UpdateBoardMeetingRequest = z.infer<typeof UpdateBoardMeetingRequestSchema>;
export type SetAgendaRequest = z.infer<typeof SetAgendaRequestSchema>;
export type BoardMeetingResponse = z.infer<typeof BoardMeetingResponseSchema>;
