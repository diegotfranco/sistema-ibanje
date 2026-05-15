import { z } from 'zod';

export const MonthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM')
});

export const DateRangeQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date()
});

export const PaginatedDateRangeQuerySchema = DateRangeQuerySchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const PaginatedMonthQuerySchema = MonthQuerySchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const OptionalMonthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM')
    .optional()
});

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type PaginatedDateRangeQuery = z.infer<typeof PaginatedDateRangeQuerySchema>;

const PeriodSchema = z.object({
  from: z.string(),
  to: z.string()
});

export const IncomeReportRowSchema = z.object({
  referenceDate: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  fundId: z.number().int().positive().nullable(),
  fundName: z.string().nullable(),
  total: z.string()
});

export const IncomeReportResponseSchema = z.object({
  period: PeriodSchema,
  totalIncome: z.string(),
  data: z.array(IncomeReportRowSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative()
});

export const ExpenseReportRowSchema = z.object({
  id: z.number().int().positive(),
  referenceDate: z.string(),
  description: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  fundId: z.number().int().positive().nullable(),
  fundName: z.string().nullable(),
  amount: z.string()
});

export const ExpenseReportResponseSchema = z.object({
  period: PeriodSchema,
  totalExpenses: z.string(),
  data: z.array(ExpenseReportRowSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative()
});

export const IncomeByCategoryRowSchema = z.object({
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  total: z.string()
});

export const ExpenseByCategoryRowSchema = z.object({
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  total: z.string()
});

export const IncomeByFundRowSchema = z.object({
  fundId: z.number().int().positive(),
  fundName: z.string(),
  total: z.string()
});

export const FinancialStatementResponseSchema = z.object({
  period: PeriodSchema,
  openingBalance: z.string(),
  totalIncome: z.string(),
  totalExpenses: z.string(),
  currentBalance: z.string(),
  incomeByCategory: z.array(IncomeByCategoryRowSchema),
  incomeByFund: z.array(IncomeByFundRowSchema),
  expensesByCategory: z.array(ExpenseByCategoryRowSchema)
});

export const IncomePivotColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  kind: z.enum(['category', 'fund']),
  refId: z.number().int().positive(),
  total: z.string()
});

export const IncomePivotRowSchema = z.object({
  referenceDate: z.string(),
  cells: z.record(z.string(), z.string()),
  total: z.string()
});

export const IncomePivotSchema = z.object({
  columns: z.array(IncomePivotColumnSchema),
  rows: z.array(IncomePivotRowSchema),
  grandTotal: z.string()
});

export const DetailedFinancialStatementResponseSchema = z.object({
  period: PeriodSchema,
  openingBalance: z.string(),
  totalIncome: z.string(),
  totalExpenses: z.string(),
  currentBalance: z.string(),
  incomePivot: IncomePivotSchema,
  expenseEntries: z.array(ExpenseReportRowSchema)
});

export const MembersReportResponseSchema = z.object({
  period: PeriodSchema,
  totalActiveMembers: z.number().int().nonnegative(),
  tithe: z.object({
    membersWhoContributed: z.number().int().nonnegative(),
    percentage: z.string()
  }),
  offerings: z.object({
    membersWhoContributed: z.number().int().nonnegative(),
    percentage: z.string(),
    note: z.string()
  })
});

export const FundSummarySchema = z.object({
  fundId: z.number().int().positive(),
  fundName: z.string(),
  targetAmount: z.string().nullable(),
  totalRaised: z.string(),
  totalExpenses: z.string(),
  balance: z.string(),
  progressPercentage: z.string().nullable()
});

export const FundListResponseSchema = z.object({
  period: PeriodSchema.nullable(),
  funds: z.array(FundSummarySchema)
});

export const FundIncomeEntrySchema = z.object({
  id: z.number().int().positive(),
  referenceDate: z.string(),
  amount: z.string(),
  categoryName: z.string(),
  attenderName: z.string().nullable(),
  notes: z.string().nullable()
});

export const FundExpenseEntrySchema = z.object({
  id: z.number().int().positive(),
  referenceDate: z.string(),
  description: z.string(),
  amount: z.string(),
  categoryName: z.string(),
  notes: z.string().nullable()
});

export const FundDetailResponseSchema = FundSummarySchema.extend({
  period: PeriodSchema.nullable(),
  incomeEntries: z.array(FundIncomeEntrySchema),
  expenseEntries: z.array(FundExpenseEntrySchema)
});

export type IncomeReportRow = z.infer<typeof IncomeReportRowSchema>;
export type IncomeAggregateRow = {
  referenceDate: string;
  columnKind: 'category' | 'fund';
  columnRefId: number;
  columnLabel: string;
  total: string;
};
export type IncomePivotColumn = z.infer<typeof IncomePivotColumnSchema>;
export type IncomePivotRow = z.infer<typeof IncomePivotRowSchema>;
export type IncomePivot = z.infer<typeof IncomePivotSchema>;
export type IncomeReportResponse = z.infer<typeof IncomeReportResponseSchema>;
export type ExpenseReportRow = z.infer<typeof ExpenseReportRowSchema>;
export type ExpenseReportResponse = z.infer<typeof ExpenseReportResponseSchema>;
export type IncomeByCategoryRow = z.infer<typeof IncomeByCategoryRowSchema>;
export type ExpenseByCategoryRow = z.infer<typeof ExpenseByCategoryRowSchema>;
export type IncomeByFundRow = z.infer<typeof IncomeByFundRowSchema>;
export type FinancialStatementResponse = z.infer<typeof FinancialStatementResponseSchema>;
export type DetailedFinancialStatementResponse = z.infer<
  typeof DetailedFinancialStatementResponseSchema
>;
export type MembersReportResponse = z.infer<typeof MembersReportResponseSchema>;
export type FundSummary = z.infer<typeof FundSummarySchema>;
export type FundListResponse = z.infer<typeof FundListResponseSchema>;
export type FundIncomeEntry = z.infer<typeof FundIncomeEntrySchema>;
export type FundExpenseEntry = z.infer<typeof FundExpenseEntrySchema>;
export type FundDetailResponse = z.infer<typeof FundDetailResponseSchema>;
