import { z } from 'zod';
import { paginatedSchema } from '../../../lib/http-schemas.js';

export const ListDesignatedFundsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateDesignatedFundRequestSchema = z.object({
  name: z.string().min(2).max(96),
  description: z.string().optional(),
  targetAmount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      'targetAmount must be a positive decimal with up to 2 decimal places'
    )
    .optional(),
  targetDate: z.string().date().nullable().optional()
});

export const UpdateDesignatedFundRequestSchema = CreateDesignatedFundRequestSchema.partial();

export const DesignatedFundResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  targetAmount: z.string().nullable(),
  targetDate: z.string().nullable(),
  status: z.string(),
  createdAt: z.date()
});

export const DesignatedFundListResponseSchema = paginatedSchema(DesignatedFundResponseSchema);

export type CreateDesignatedFundRequest = z.infer<typeof CreateDesignatedFundRequestSchema>;
export type UpdateDesignatedFundRequest = z.infer<typeof UpdateDesignatedFundRequestSchema>;
export type DesignatedFundResponse = z.infer<typeof DesignatedFundResponseSchema>;
