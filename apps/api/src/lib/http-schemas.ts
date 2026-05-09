import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional()
});

export const NoContentSchema = z.null().describe('No content');

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative()
  });
}
