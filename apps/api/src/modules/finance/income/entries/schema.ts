import { z } from 'zod';

export const ListIncomeEntriesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateIncomeEntryRequestSchema = z.object({
  referenceDate: z.string().date(),
  depositDate: z.string().date().optional(),
  amount: z.number().positive(),
  categoryId: z.number().int().positive(),
  memberId: z.number().int().positive().optional(),
  paymentMethodId: z.number().int().positive(),
  designatedFundId: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional()
});

export const UpdateIncomeEntryRequestSchema = CreateIncomeEntryRequestSchema.partial().extend({
  status: z.enum(['pendente', 'paga', 'cancelada']).optional()
});

export type CreateIncomeEntryRequest = z.infer<typeof CreateIncomeEntryRequestSchema>;
export type UpdateIncomeEntryRequest = z.infer<typeof UpdateIncomeEntryRequestSchema>;

export type IncomeEntryResponse = {
  id: number;
  referenceDate: string;
  depositDate: string | null;
  amount: string;
  categoryId: number;
  categoryName: string;
  memberId: number | null;
  memberName: string | null;
  paymentMethodId: number;
  paymentMethodName: string;
  designatedFundId: number | null;
  designatedFundName: string | null;
  notes: string | null;
  userId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
