import { z } from 'zod';
import { MeetingType } from '@sistema-ibanje/shared';

export const AgendaItemTemplateSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(256),
  description: z.string().max(2048).nullable().optional().or(z.literal(''))
});

export type AgendaItemTemplate = z.infer<typeof AgendaItemTemplateSchema>;

export const MinuteTemplateFormSchema = z.object({
  meetingType: z
    .string()
    .refine(
      (v) =>
        Object.values(MeetingType).includes(
          v as unknown as (typeof MeetingType)[keyof typeof MeetingType]
        ),
      'Tipo de reunião obrigatório'
    ) as z.ZodType<string>,
  name: z.string().min(1, 'Nome obrigatório').max(128),
  content: z.unknown().refine((v) => v !== null && typeof v === 'object', 'Conteúdo obrigatório'),
  isDefault: z.boolean().default(false),
  defaultAgendaItems: z.array(AgendaItemTemplateSchema).default([])
});

export type MinuteTemplateFormValues = z.infer<typeof MinuteTemplateFormSchema>;

export type MinuteTemplateResponse = {
  id: number;
  meetingType: string;
  name: string;
  content: unknown;
  isDefault: boolean;
  defaultAgendaItems: AgendaItemTemplate[];
  createdAt: string;
  updatedAt: string;
};
