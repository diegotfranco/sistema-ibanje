import { z } from 'zod';

export const ListExpenseCategoriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateExpenseCategoryRequestSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().max(256).optional(),
  parentId: z.number().int().positive().optional()
});

export const UpdateExpenseCategoryRequestSchema = CreateExpenseCategoryRequestSchema.partial();

export type CreateExpenseCategoryRequest = z.infer<typeof CreateExpenseCategoryRequestSchema>;
export type UpdateExpenseCategoryRequest = z.infer<typeof UpdateExpenseCategoryRequestSchema>;

export type ExpenseCategoryResponse = {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
};
