import { z } from 'zod';

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

export type CreateBoardMeetingRequest = z.infer<typeof CreateBoardMeetingRequestSchema>;
export type UpdateBoardMeetingRequest = z.infer<typeof UpdateBoardMeetingRequestSchema>;
export type SetAgendaRequest = z.infer<typeof SetAgendaRequestSchema>;

export type BoardMeetingResponse = {
  id: number;
  meetingDate: string;
  type: 'ordinária' | 'extraordinária';
  agendaItems: string[] | null;
  agendaAuthorId: number | null;
  agendaCreatedAt: string | null;
  isPublic: boolean;
  status: string;
  hasMinutes: boolean;
  createdAt: string;
  updatedAt: string;
};
