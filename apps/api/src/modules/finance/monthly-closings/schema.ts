import { z } from 'zod';
import { paginatedSchema } from '../../../lib/http-schemas.js';

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

export const MonthlyClosingResponseSchema = z.object({
  id: z.number().int().positive(),
  periodYear: z.number().int(),
  periodMonth: z.number().int(),
  status: z.string(),
  openingBalance: z.string(),
  openingBalancePending: z.boolean(),
  closingBalance: z.string(),
  totalIncome: z.string(),
  totalExpenses: z.string(),
  treasurerNotes: z.string().nullable(),
  accountantNotes: z.string().nullable(),
  submittedByUserId: z.number().int().positive().nullable(),
  submittedAt: z.date().nullable(),
  reviewedAt: z.date().nullable(),
  closedByUserId: z.number().int().positive().nullable(),
  closedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  totalReservedFunds: z.string().optional()
});

export const MonthlyClosingListResponseSchema = paginatedSchema(MonthlyClosingResponseSchema);

export type CreateMonthlyClosingRequest = z.infer<typeof CreateMonthlyClosingRequestSchema>;
export type SubmitMonthlyClosingRequest = z.infer<typeof SubmitMonthlyClosingRequestSchema>;
export type ApproveMonthlyClosingRequest = z.infer<typeof ApproveMonthlyClosingRequestSchema>;
export type RejectMonthlyClosingRequest = z.infer<typeof RejectMonthlyClosingRequestSchema>;
export type MonthlyClosingResponse = z.infer<typeof MonthlyClosingResponseSchema>;
