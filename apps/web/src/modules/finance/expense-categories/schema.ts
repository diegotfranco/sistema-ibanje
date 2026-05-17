import { z } from 'zod';

export const ExpenseCategoryFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(64, 'Máximo de 64 caracteres'),
  description: z.string().max(256).optional().or(z.literal('')),
  parentId: z.number().int().positive().optional()
});

export type ExpenseCategoryFormValues = z.infer<typeof ExpenseCategoryFormSchema>;

export type ExpenseCategoryResponse = {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
};
