import { z } from 'zod';
import { paginatedSchema } from '../../../../lib/http-schemas.js';

export const ListIncomeEntriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateIncomeEntryRequestSchema = z.object({
  referenceDate: z.string().date(),
  depositDate: z.string().date().optional(),
  attributionMonth: z
    .string()
    .regex(/^\d{4}-\d{2}-01$/, 'attributionMonth must be the first day of a month (YYYY-MM-01)')
    .optional(),
  amount: z.number().positive(),
  categoryId: z.number().int().positive(),
  attenderId: z.number().int().positive().optional(),
  paymentMethodId: z.number().int().positive(),
  designatedFundId: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional()
});

export const UpdateIncomeEntryRequestSchema = CreateIncomeEntryRequestSchema.partial().extend({
  status: z.enum(['pendente', 'paga', 'cancelada']).optional()
});

export const IncomeEntryResponseSchema = z.object({
  id: z.number().int().positive(),
  referenceDate: z.string(),
  depositDate: z.string().nullable(),
  attributionMonth: z.string().nullable(),
  amount: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  attenderId: z.number().int().positive().nullable(),
  attenderName: z.string().nullable(),
  paymentMethodId: z.number().int().positive(),
  paymentMethodName: z.string(),
  designatedFundId: z.number().int().positive().nullable(),
  designatedFundName: z.string().nullable(),
  notes: z.string().nullable(),
  userId: z.number().int().positive(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const IncomeEntryListResponseSchema = paginatedSchema(IncomeEntryResponseSchema);

export type CreateIncomeEntryRequest = z.infer<typeof CreateIncomeEntryRequestSchema>;
export type UpdateIncomeEntryRequest = z.infer<typeof UpdateIncomeEntryRequestSchema>;
export type IncomeEntryResponse = z.infer<typeof IncomeEntryResponseSchema>;
