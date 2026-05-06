import { z } from 'zod';

export const IncomeCategoryFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(64, 'Máximo de 64 caracteres'),
  description: z.string().max(256).optional().or(z.literal('')),
  parentId: z.number().int().positive().optional(),
  requiresMember: z.boolean()
});

export type IncomeCategoryFormValues = z.infer<typeof IncomeCategoryFormSchema>;

export type IncomeCategoryResponse = {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  requiresMember: boolean;
  status: string;
  createdAt: string;
};
