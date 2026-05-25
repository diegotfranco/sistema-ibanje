import { z } from 'zod';
import { paginatedSchema } from '../../../../lib/http-schemas.js';

export const ListExpenseEntriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateExpenseEntryRequestSchema = z
  .object({
    date: z.iso.date(),
    total: z.number().nonnegative(),
    amount: z.number().positive(),
    installment: z.number().int().positive().default(1),
    totalInstallments: z.number().int().positive().default(1),
    categoryId: z.number().int().positive(),
    paymentMethodId: z.number().int().positive(),
    designatedFundId: z.number().int().positive().optional(),
    eventId: z.number().int().positive().optional(),
    attenderId: z.number().int().positive().optional(),
    parentId: z.number().int().positive().optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['pendente', 'paga', 'cancelada']).optional()
  })
  .refine((d) => !(d.designatedFundId && d.eventId), {
    message: 'Selecione um fundo OU um evento, não ambos.',
    path: ['eventId']
  });

export const UpdateExpenseEntryRequestSchema = z
  .object({
    date: z.iso.date().optional(),
    total: z.number().nonnegative().optional(),
    amount: z.number().positive().optional(),
    installment: z.number().int().positive().optional(),
    totalInstallments: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    paymentMethodId: z.number().int().positive().optional(),
    designatedFundId: z.number().int().positive().nullable().optional(),
    eventId: z.number().int().positive().nullable().optional(),
    attenderId: z.number().int().positive().optional(),
    parentId: z.number().int().positive().optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['pendente', 'paga', 'cancelada']).optional()
  })
  .refine((d) => !(d.designatedFundId && d.eventId), {
    message: 'Selecione um fundo OU um evento, não ambos.',
    path: ['eventId']
  });

export const ExpenseEntryResponseSchema = z.object({
  id: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  date: z.string(),
  total: z.string(),
  amount: z.string(),
  installment: z.number().int(),
  totalInstallments: z.number().int(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  paymentMethodId: z.number().int().positive(),
  paymentMethodName: z.string(),
  designatedFundId: z.number().int().positive().nullable(),
  designatedFundName: z.string().nullable(),
  eventId: z.number().int().positive().nullable(),
  eventName: z.string().nullable(),
  attenderId: z.number().int().positive().nullable(),
  attenderName: z.string().nullable(),
  hasReceipt: z.boolean(),
  notes: z.string().nullable(),
  userId: z.number().int().positive(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ExpenseEntryListResponseSchema = paginatedSchema(ExpenseEntryResponseSchema);

export const ExpenseSummaryQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date()
});

export const ExpenseSummaryRowSchema = z.object({
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  total: z.string()
});

export const ExpenseSummaryResponseSchema = z.object({
  rows: z.array(ExpenseSummaryRowSchema),
  total: z.string(),
  totalIncome: z.string()
});

export type CreateExpenseEntryRequest = z.infer<typeof CreateExpenseEntryRequestSchema>;
export type UpdateExpenseEntryRequest = z.infer<typeof UpdateExpenseEntryRequestSchema>;
export type ExpenseEntryResponse = z.infer<typeof ExpenseEntryResponseSchema>;
export type ExpenseSummaryQuery = z.infer<typeof ExpenseSummaryQuerySchema>;
export type ExpenseSummaryResponse = z.infer<typeof ExpenseSummaryResponseSchema>;
