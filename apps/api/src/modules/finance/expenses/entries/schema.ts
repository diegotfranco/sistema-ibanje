import { z } from 'zod';

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
  parentId: z.number().int().positive().optional(),
  receipt: z.string().optional(),
  notes: z.string().max(1000).optional()
});

export const UpdateExpenseEntryRequestSchema = CreateExpenseEntryRequestSchema.partial().extend({
  status: z.enum(['pendente', 'paga', 'cancelada']).optional()
});

export type CreateExpenseEntryRequest = z.infer<typeof CreateExpenseEntryRequestSchema>;
export type UpdateExpenseEntryRequest = z.infer<typeof UpdateExpenseEntryRequestSchema>;

export type ExpenseEntryResponse = {
  id: number;
  parentId: number | null;
  referenceDate: string;
  description: string;
  total: string;
  amount: string;
  installment: number;
  totalInstallments: number;
  categoryId: number;
  categoryName: string;
  paymentMethodId: number;
  paymentMethodName: string;
  designatedFundId: number | null;
  designatedFundName: string | null;
  receipt: string | null;
  notes: string | null;
  userId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
