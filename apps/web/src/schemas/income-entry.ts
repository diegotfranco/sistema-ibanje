import { z } from 'zod';

export const IncomeEntryFormSchema = z.object({
  referenceDate: z.string().min(1, 'Data de referência é obrigatória.'),
  depositDate: z.string().optional().or(z.literal('')),
  amount: z
    .string()
    .min(1, 'Valor é obrigatório.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Use formato decimal (ex.: 100.00).'),
  categoryId: z.number({ error: 'Categoria é obrigatória.' }).int().positive(),
  memberId: z.number().int().positive().optional(),
  paymentMethodId: z.number({ error: 'Forma de pagamento é obrigatória.' }).int().positive(),
  designatedFundId: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(['pendente', 'paga', 'cancelada']).optional()
});

export type IncomeEntryFormValues = z.infer<typeof IncomeEntryFormSchema>;

export type IncomeEntryCreateBody = {
  referenceDate: string;
  depositDate?: string;
  amount: number;
  categoryId: number;
  memberId?: number;
  paymentMethodId: number;
  designatedFundId?: number;
  notes?: string;
};

export type IncomeEntryUpdateBody = Partial<IncomeEntryCreateBody> & {
  status?: 'pendente' | 'paga' | 'cancelada';
};

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
  createdAt: string;
  updatedAt: string;
};
