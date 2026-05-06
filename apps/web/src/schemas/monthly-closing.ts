import { z } from 'zod';

export const NewClosingSchema = z.object({
  periodYear: z.coerce.number().int().min(2000).max(2100),
  periodMonth: z.coerce.number().int().min(1).max(12)
});

export type NewClosingFormValues = z.infer<typeof NewClosingSchema>;

export const TransitionNotesSchema = z.object({
  notes: z.string().max(2000).optional().or(z.literal(''))
});

export type TransitionNotesFormValues = z.infer<typeof TransitionNotesSchema>;

export type MonthlyClosingResponse = {
  id: number;
  periodYear: number;
  periodMonth: number;
  status: string;
  openingBalance: string;
  openingBalancePending: boolean;
  closingBalance: string;
  totalIncome: string;
  totalExpenses: string;
  treasurerNotes: string | null;
  accountantNotes: string | null;
  submittedByUserId: number | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  closedByUserId: number | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalReservedFunds?: string;
};
