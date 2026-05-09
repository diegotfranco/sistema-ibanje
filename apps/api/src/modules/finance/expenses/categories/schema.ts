import { z } from 'zod';
import { paginatedSchema } from '../../../../lib/http-schemas.js';

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

export const ExpenseCategoryResponseSchema = z.object({
  id: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  createdAt: z.date()
});

export const ExpenseCategoryListResponseSchema = paginatedSchema(ExpenseCategoryResponseSchema);

export type CreateExpenseCategoryRequest = z.infer<typeof CreateExpenseCategoryRequestSchema>;
export type UpdateExpenseCategoryRequest = z.infer<typeof UpdateExpenseCategoryRequestSchema>;
export type ExpenseCategoryResponse = z.infer<typeof ExpenseCategoryResponseSchema>;
