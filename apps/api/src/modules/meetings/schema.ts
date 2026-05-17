import { z } from 'zod';
import { MEETING_TYPE_VALUES } from '@sistema-ibanje/shared';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListMeetingsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateMeetingRequestSchema = z.object({
  meetingDate: z.string().date(),
  type: z.enum(MEETING_TYPE_VALUES),
  isPublic: z.boolean().default(false)
});

export const UpdateMeetingRequestSchema = z.object({
  meetingDate: z.string().date().optional(),
  type: z.enum(MEETING_TYPE_VALUES).optional(),
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

export const MeetingResponseSchema = z.object({
  id: z.number().int().positive(),
  meetingDate: z.string(),
  type: z.enum(MEETING_TYPE_VALUES),
  agendaItems: z.array(AgendaItemResponseSchema),
  isPublic: z.boolean(),
  status: z.string(),
  hasMinutes: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const MeetingListResponseSchema = paginatedSchema(MeetingResponseSchema);

export type CreateMeetingRequest = z.infer<typeof CreateMeetingRequestSchema>;
export type UpdateMeetingRequest = z.infer<typeof UpdateMeetingRequestSchema>;
export type SetAgendaItemsRequest = z.infer<typeof SetAgendaItemsRequestSchema>;
export type AgendaItemResponse = z.infer<typeof AgendaItemResponseSchema>;
export type MeetingResponse = z.infer<typeof MeetingResponseSchema>;
