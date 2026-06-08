import { z } from 'zod';
import { EntryStatus } from '@sistema-ibanje/shared';

export const ExpenseEntryFormSchema = z
  .object({
    isInstallment: z.boolean().default(false),
    date: z.string().min(1, 'Data é obrigatória.'),
    amount: z
      .string()
      .min(1, 'Valor é obrigatório.')
      .regex(/^\d+(\.\d{1,2})?$/, 'Use formato decimal (ex.: 100.00).'),
    total: z
      .string()
      .regex(/^\d+(\.\d{0,2})?$/, 'Use formato decimal (ex.: 100.00).')
      .optional()
      .or(z.literal('')),
    installment: z.coerce.number().int().positive().optional(),
    totalInstallments: z.coerce.number().int().positive().optional(),
    categoryId: z.number({ error: 'Categoria é obrigatória.' }).int().positive(),
    paymentMethodId: z.number({ error: 'Forma de pagamento é obrigatória.' }).int().positive(),
    campaignId: z.number().int().positive().optional(),
    eventId: z.number().int().positive().optional(),
    attenderId: z.number().int().positive().optional(),
    notes: z.string().max(1000).optional().or(z.literal('')),
    status: z
      .enum([EntryStatus.Pending, EntryStatus.Paid, EntryStatus.Cancelled] as const)
      .optional()
  })
  .superRefine((data, ctx) => {
    if (data.campaignId && data.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['eventId'],
        message: 'Selecione uma campanha OU um evento, não ambos.'
      });
    }
    if (!data.isInstallment) return;
    if (!data.total || !/^\d+(\.\d{0,2})?$/.test(data.total)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['total'],
        message: data.total ? 'Use formato decimal (ex.: 100.00).' : 'Valor total é obrigatório.'
      });
    }
    if (!data.installment || data.installment < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['installment'],
        message: 'Número da parcela inválido.'
      });
    }
    if (!data.totalInstallments || data.totalInstallments < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalInstallments'],
        message: 'Total de parcelas inválido.'
      });
    }
  });

export type ExpenseEntryFormValues = z.infer<typeof ExpenseEntryFormSchema>;

export type ExpenseEntryCreateBody = {
  date: string;
  amount: number;
  total: number;
  installment: number;
  totalInstallments: number;
  categoryId: number;
  paymentMethodId: number;
  campaignId?: number | null;
  eventId?: number | null;
  attenderId?: number;
  notes?: string;
  status?: string;
};

export type ExpenseEntryUpdateBody = Partial<ExpenseEntryCreateBody> & {
  status?: (typeof EntryStatus)[keyof typeof EntryStatus];
};

export type ExpenseEntryResponse = {
  id: number;
  parentId: number | null;
  date: string;
  total: string;
  amount: string;
  installment: number;
  totalInstallments: number;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  paymentMethodId: number;
  paymentMethodName: string;
  campaignId: number | null;
  campaignName: string | null;
  eventId: number | null;
  eventName: string | null;
  attenderId: number | null;
  attenderName: string | null;
  hasReceipt: boolean;
  notes: string | null;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};
