import { z } from 'zod';
import { EntryStatus } from '@sistema-ibanje/shared';

export const ExpenseEntryFormSchema = z.object({
  referenceDate: z.string().min(1, 'Data de referência é obrigatória.'),
  description: z.string().min(1, 'Descrição é obrigatória.').max(256, 'Máximo de 256 caracteres.'),
  amount: z
    .string()
    .min(1, 'Valor da parcela é obrigatório.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Use formato decimal (ex.: 100.00).'),
  total: z
    .string()
    .min(1, 'Valor total é obrigatório.')
    .regex(/^\d+(\.\d{0,2})?$/, 'Use formato decimal (ex.: 100.00).'),
  installment: z.coerce.number().int().positive('Número da parcela inválido.'),
  totalInstallments: z.coerce.number().int().positive('Total de parcelas inválido.'),
  categoryId: z.number({ error: 'Categoria é obrigatória.' }).int().positive(),
  paymentMethodId: z.number({ error: 'Forma de pagamento é obrigatória.' }).int().positive(),
  designatedFundId: z.number().int().positive().optional(),
  attenderId: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum([EntryStatus.Pending, EntryStatus.Paid, EntryStatus.Cancelled] as const).optional()
});

export type ExpenseEntryFormValues = z.infer<typeof ExpenseEntryFormSchema>;

export type ExpenseEntryCreateBody = {
  referenceDate: string;
  description: string;
  amount: number;
  total: number;
  installment: number;
  totalInstallments: number;
  categoryId: number;
  paymentMethodId: number;
  designatedFundId?: number;
  attenderId?: number;
  notes?: string;
};

export type ExpenseEntryUpdateBody = Partial<ExpenseEntryCreateBody> & {
  status?: (typeof EntryStatus)[keyof typeof EntryStatus];
};

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
  attenderId: number | null;
  attenderName: string | null;
  receipt: string | null;
  notes: string | null;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};
