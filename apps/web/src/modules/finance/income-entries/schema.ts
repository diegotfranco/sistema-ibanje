import { z } from 'zod';
import { EntryStatus } from '@sistema-ibanje/shared';

export const IncomeEntryFormSchema = z
  .object({
    depositDate: z.string().min(1, 'Data de depósito é obrigatória.'),
    amount: z
      .string()
      .min(1, 'Valor é obrigatório.')
      .regex(/^\d+(\.\d{1,2})?$/, 'Use formato decimal (ex.: 100.00).'),
    categoryId: z.number({ error: 'Categoria é obrigatória.' }).int().positive(),
    attenderId: z.number().int().positive().optional(),
    paymentMethodId: z.number({ error: 'Forma de pagamento é obrigatória.' }).int().positive(),
    campaignId: z.number().int().positive().optional(),
    eventId: z.number().int().positive().optional(),
    notes: z.string().max(1000).optional().or(z.literal('')),
    status: z
      .enum([EntryStatus.Pending, EntryStatus.Paid, EntryStatus.Cancelled] as const)
      .optional()
  })
  .refine((d) => !(d.campaignId && d.eventId), {
    message: 'Selecione uma campanha OU um evento, não ambos.',
    path: ['eventId']
  });

export type IncomeEntryFormValues = z.infer<typeof IncomeEntryFormSchema>;

export type IncomeEntryCreateBody = {
  depositDate: string;
  amount: number;
  categoryId: number;
  attenderId?: number;
  paymentMethodId: number;
  campaignId?: number | null;
  eventId?: number | null;
  notes?: string;
  status?: string;
};

export type IncomeEntryUpdateBody = Partial<IncomeEntryCreateBody> & {
  status?: (typeof EntryStatus)[keyof typeof EntryStatus];
};

export type IncomeEntryResponse = {
  id: number;
  depositDate: string;
  referenceDate: string;
  amount: string;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  attenderId: number | null;
  attenderName: string | null;
  paymentMethodId: number;
  paymentMethodName: string;
  campaignId: number | null;
  campaignName: string | null;
  eventId: number | null;
  eventName: string | null;
  notes: string | null;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};
