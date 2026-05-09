import { z } from 'zod';
import { paginatedSchema } from '../../../../lib/http-schemas.js';

export const ListExpenseEntriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateExpenseEntryRequestSchema = z.object({
  referenceDate: z.string().date(),
  description: z.string().min(1).max(256),
  total: z.number().nonnegative(),
  amount: z.number().positive(),
  installment: z.number().int().positive().default(1),
  totalInstallments: z.number().int().positive().default(1),
  categoryId: z.number().int().positive(),
  paymentMethodId: z.number().int().positive(),
  designatedFundId: z.number().int().positive().optional(),
  memberId: z.number().int().positive().optional(),
  parentId: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional()
});

export const UpdateExpenseEntryRequestSchema = z.object({
  referenceDate: z.string().date().optional(),
  description: z.string().min(1).max(256).optional(),
  total: z.number().nonnegative().optional(),
  amount: z.number().positive().optional(),
  installment: z.number().int().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  paymentMethodId: z.number().int().positive().optional(),
  designatedFundId: z.number().int().positive().optional(),
  memberId: z.number().int().positive().optional(),
  parentId: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['pendente', 'paga', 'cancelada']).optional()
});

export const ExpenseEntryResponseSchema = z.object({
  id: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  referenceDate: z.string(),
  description: z.string(),
  total: z.string(),
  amount: z.string(),
  installment: z.number().int(),
  totalInstallments: z.number().int(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  paymentMethodId: z.number().int().positive(),
  paymentMethodName: z.string(),
  designatedFundId: z.number().int().positive().nullable(),
  designatedFundName: z.string().nullable(),
  memberId: z.number().int().positive().nullable(),
  memberName: z.string().nullable(),
  receipt: z.string().nullable(),
  notes: z.string().nullable(),
  userId: z.number().int().positive(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ExpenseEntryListResponseSchema = paginatedSchema(ExpenseEntryResponseSchema);

export type CreateExpenseEntryRequest = z.infer<typeof CreateExpenseEntryRequestSchema>;
export type UpdateExpenseEntryRequest = z.infer<typeof UpdateExpenseEntryRequestSchema>;
export type ExpenseEntryResponse = z.infer<typeof ExpenseEntryResponseSchema>;
