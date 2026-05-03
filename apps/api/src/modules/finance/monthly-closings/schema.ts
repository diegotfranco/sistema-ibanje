import { z } from 'zod';

export const ListMonthlyClosingsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateMonthlyClosingRequestSchema = z.object({
  periodYear: z.number().int().min(2000).max(2100),
  periodMonth: z.number().int().min(1).max(12)
});

export const SubmitMonthlyClosingRequestSchema = z.object({
  treasurerNotes: z.string().max(2000).optional()
});

export const ApproveMonthlyClosingRequestSchema = z.object({
  accountantNotes: z.string().max(2000).optional()
});

export const RejectMonthlyClosingRequestSchema = z.object({
  accountantNotes: z.string().max(2000).optional()
});

export type CreateMonthlyClosingRequest = z.infer<typeof CreateMonthlyClosingRequestSchema>;
export type SubmitMonthlyClosingRequest = z.infer<typeof SubmitMonthlyClosingRequestSchema>;
export type ApproveMonthlyClosingRequest = z.infer<typeof ApproveMonthlyClosingRequestSchema>;
export type RejectMonthlyClosingRequest = z.infer<typeof RejectMonthlyClosingRequestSchema>;

export type ReservedFundBalance = {
  fundId: number;
  fundName: string;
  balance: string;
};

export type MonthlyClosingResponse = {
  id: number;
  periodYear: number;
  periodMonth: number;
  status: string;
  closingBalance: string;
  totalIncome: string;
  totalExpenses: string;
  treasurerNotes: string | null;
  accountantNotes: string | null;
  submittedByUserId: number | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  closedByUserId: number | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reservedFunds?: ReservedFundBalance[];
};
