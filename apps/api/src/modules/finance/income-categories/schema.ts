import { z } from 'zod';

export const ListIncomeCategoriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateIncomeCategoryRequestSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().max(256).optional(),
  parentId: z.number().int().positive().optional(),
  requiresDonor: z.boolean().default(false)
});

export const UpdateIncomeCategoryRequestSchema = CreateIncomeCategoryRequestSchema.partial();

export type CreateIncomeCategoryRequest = z.infer<typeof CreateIncomeCategoryRequestSchema>;
export type UpdateIncomeCategoryRequest = z.infer<typeof UpdateIncomeCategoryRequestSchema>;

export type IncomeCategoryResponse = {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  requiresDonor: boolean;
  status: string;
  createdAt: Date;
};
