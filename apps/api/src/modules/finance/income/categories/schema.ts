import { z } from 'zod';
import { paginatedSchema } from '../../../../lib/http-schemas.js';

export const ListIncomeCategoriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateIncomeCategoryRequestSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().max(256).optional(),
  parentId: z.number().int().positive().optional(),
  requiresMember: z.boolean().default(false)
});

export const UpdateIncomeCategoryRequestSchema = CreateIncomeCategoryRequestSchema.partial();

export const IncomeCategoryResponseSchema = z.object({
  id: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  requiresMember: z.boolean(),
  status: z.string(),
  createdAt: z.date()
});

export const IncomeCategoryListResponseSchema = paginatedSchema(IncomeCategoryResponseSchema);

export type CreateIncomeCategoryRequest = z.infer<typeof CreateIncomeCategoryRequestSchema>;
export type UpdateIncomeCategoryRequest = z.infer<typeof UpdateIncomeCategoryRequestSchema>;
export type IncomeCategoryResponse = z.infer<typeof IncomeCategoryResponseSchema>;
