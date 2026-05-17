import { z } from 'zod';
import { MEETING_TYPE_VALUES, type MeetingTypeValue } from '@sistema-ibanje/shared';

export const MeetingFormSchema = z.object({
  meetingDate: z.string().min(1, 'Data obrigatória'),
  type: z.enum(MEETING_TYPE_VALUES),
  isPublic: z.boolean().default(false)
});

export type MeetingFormValues = z.infer<typeof MeetingFormSchema>;

export const AgendaItemInputSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(256, 'Máximo de 256 caracteres'),
  description: z.string().max(2000, 'Máximo de 2000 caracteres').optional().or(z.literal(''))
});

export const AgendaFormSchema = z.object({
  items: z.array(AgendaItemInputSchema).min(1, 'Adicione pelo menos um item').max(50)
});

export type AgendaItemInput = z.infer<typeof AgendaItemInputSchema>;
export type AgendaFormValues = z.infer<typeof AgendaFormSchema>;

export type AgendaItemResponse = {
  id: number;
  meetingId: number;
  order: number;
  title: string;
  description: string | null;
  createdByUserId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type MeetingResponse = {
  id: number;
  meetingDate: string;
  type: MeetingTypeValue;
  agendaItems: AgendaItemResponse[];
  isPublic: boolean;
  status: string;
  hasMinutes: boolean;
  createdAt: string;
  updatedAt: string;
};
