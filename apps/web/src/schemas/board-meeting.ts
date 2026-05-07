import { z } from 'zod';

export const BoardMeetingFormSchema = z.object({
  meetingDate: z.string().min(1, 'Data obrigatória'),
  type: z.enum(['ordinária', 'extraordinária']),
  isPublic: z.boolean().default(false)
});

export type BoardMeetingFormValues = z.infer<typeof BoardMeetingFormSchema>;

export const AgendaFormSchema = z.object({
  agendaText: z.string().min(1, 'Pautas não podem ser vazias')
});

export type AgendaFormValues = z.infer<typeof AgendaFormSchema>;

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
