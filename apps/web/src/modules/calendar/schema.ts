import { z } from 'zod';

export const CalendarEntryFormSchema = z.object({
  title: z.string().min(2, 'Mínimo de 2 caracteres').max(128, 'Máximo de 128 caracteres'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  notes: z.string().max(2000).optional().or(z.literal(''))
});

export type CalendarEntryFormValues = z.infer<typeof CalendarEntryFormSchema>;

export type CalendarEntryResponse = {
  id: number;
  title: string;
  date: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};
