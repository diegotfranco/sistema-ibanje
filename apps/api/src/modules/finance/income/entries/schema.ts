import { z } from 'zod';
import { paginatedSchema } from '../../../../lib/http-schemas.js';

// Month-granular wire format `YYYY-MM`; the service converts to/from the DB's YYYYMM integer.
const MonthStringSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Formato esperado: YYYY-MM');

export const ListIncomeEntriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateIncomeEntryRequestSchema = z
  .object({
    depositDate: z.iso.date(),
    attributionMonth: MonthStringSchema.optional(),
    amount: z.number().positive(),
    categoryId: z.number().int().positive(),
    attenderId: z.number().int().positive().optional(),
    paymentMethodId: z.number().int().positive(),
    campaignId: z.number().int().positive().optional(),
    eventId: z.number().int().positive().optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['pendente', 'paga', 'cancelada']).optional()
  })
  .refine((d) => !(d.campaignId && d.eventId), {
    message: 'Selecione uma campanha OU um evento, não ambos.',
    path: ['eventId']
  });

export const UpdateIncomeEntryRequestSchema = z
  .object({
    depositDate: z.iso.date().optional(),
    attributionMonth: MonthStringSchema.optional(),
    amount: z.number().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    attenderId: z.number().int().positive().optional(),
    paymentMethodId: z.number().int().positive().optional(),
    campaignId: z.number().int().positive().nullable().optional(),
    eventId: z.number().int().positive().nullable().optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['pendente', 'paga', 'cancelada']).optional()
  })
  .refine((d) => !(d.campaignId && d.eventId), {
    message: 'Selecione uma campanha OU um evento, não ambos.',
    path: ['eventId']
  });

export const IncomeEntryResponseSchema = z.object({
  id: z.number().int().positive(),
  depositDate: z.iso.date(),
  referenceDate: z.iso.date(),
  attributionMonth: MonthStringSchema.nullable(),
  amount: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  attenderId: z.number().int().positive().nullable(),
  attenderName: z.string().nullable(),
  paymentMethodId: z.number().int().positive(),
  paymentMethodName: z.string(),
  campaignId: z.number().int().positive().nullable(),
  campaignName: z.string().nullable(),
  eventId: z.number().int().positive().nullable(),
  eventName: z.string().nullable(),
  notes: z.string().nullable(),
  userId: z.number().int().positive(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const IncomeEntryListResponseSchema = paginatedSchema(IncomeEntryResponseSchema);

export const IncomeSummaryQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date()
});

export const IncomeSummaryRowSchema = z.object({
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  total: z.string()
});

export const IncomeSummaryResponseSchema = z.object({
  rows: z.array(IncomeSummaryRowSchema),
  total: z.string(),
  totalExpense: z.string()
});

export type CreateIncomeEntryRequest = z.infer<typeof CreateIncomeEntryRequestSchema>;
export type UpdateIncomeEntryRequest = z.infer<typeof UpdateIncomeEntryRequestSchema>;
export type IncomeEntryResponse = z.infer<typeof IncomeEntryResponseSchema>;
export type IncomeSummaryQuery = z.infer<typeof IncomeSummaryQuerySchema>;
export type IncomeSummaryResponse = z.infer<typeof IncomeSummaryResponseSchema>;
