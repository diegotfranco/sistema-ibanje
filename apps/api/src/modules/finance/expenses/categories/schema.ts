import { z } from 'zod';
import { paginatedSchema } from '../../../../lib/http-schemas.js';
import { trimmedString } from '../../../../lib/normalize.js';

export const ListExpenseCategoriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
  q: z.string().trim().min(1).max(64).optional(),
  deleted: z.enum(['only', 'include']).optional()
});

export type ListExpenseCategoriesRequest = z.infer<typeof ListExpenseCategoriesRequestSchema>;

export const CreateExpenseCategoryRequestSchema = z.object({
  name: trimmedString(64, 2),
  description: trimmedString(256).optional(),
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
