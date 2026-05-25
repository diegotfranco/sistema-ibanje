import { z } from 'zod';

export const EventFormSchema = z
  .object({
    title: z.string().min(2, 'Mínimo de 2 caracteres').max(128, 'Máximo de 128 caracteres'),
    description: z.string().max(2000).optional().or(z.literal('')),
    location: z.string().max(128).optional().or(z.literal('')),
    startTime: z.string().min(1, 'Início obrigatório'),
    endTime: z.string().min(1, 'Término obrigatório')
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'Término deve ser após o início',
    path: ['endTime']
  });

export type EventFormValues = z.infer<typeof EventFormSchema>;

export type EventResponse = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
