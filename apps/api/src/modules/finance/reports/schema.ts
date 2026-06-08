import { z } from 'zod';

export const MonthQueryRequestSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM')
});

export const DateRangeQueryRequestSchema = z.object({
  from: z.string().date(),
  to: z.string().date()
});

export const PaginatedDateRangeQueryRequestSchema = DateRangeQueryRequestSchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const PaginatedMonthQueryRequestSchema = MonthQueryRequestSchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pendente', 'paga', 'cancelada']).optional()
});

export const OptionalMonthQueryRequestSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM')
    .optional()
});

export type DateRangeQueryRequest = z.infer<typeof DateRangeQueryRequestSchema>;
export type PaginatedDateRangeQueryRequest = z.infer<typeof PaginatedDateRangeQueryRequestSchema>;

const PeriodSchema = z.object({
  from: z.string(),
  to: z.string()
});

const IncomeReportRowSchema = z.object({
  id: z.number().int().positive(),
  referenceDate: z.string(),
  depositDate: z.string().nullable(),
  amount: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  campaignId: z.number().int().positive().nullable(),
  campaignName: z.string().nullable(),
  attenderId: z.number().int().positive().nullable(),
  attenderName: z.string().nullable(),
  paymentMethodName: z.string(),
  notes: z.string().nullable(),
  status: z.enum(['pendente', 'paga', 'cancelada'])
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

const ExpenseReportRowSchema = z.object({
  id: z.number().int().positive(),
  date: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  campaignId: z.number().int().positive().nullable(),
  campaignName: z.string().nullable(),
  attenderId: z.number().int().positive().nullable(),
  attenderName: z.string().nullable(),
  paymentMethodName: z.string(),
  installment: z.number().int(),
  totalInstallments: z.number().int(),
  hasReceipt: z.boolean(),
  notes: z.string().nullable(),
  amount: z.string(),
  status: z.enum(['pendente', 'paga', 'cancelada'])
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

const IncomeByCategoryRowSchema = z.object({
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  total: z.string()
});

const ExpenseByCategoryRowSchema = z.object({
  parentCategoryId: z.number().int().positive().nullable(),
  parentCategoryName: z.string().nullable(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  total: z.string()
});

const IncomeByCampaignRowSchema = z.object({
  campaignId: z.number().int().positive(),
  campaignName: z.string(),
  total: z.string()
});

// IncomeAggregateRow comes from the repository, not a schema
// It's not validated through Zod, so we don't have a schema for it

const IncomePivotColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  groupKey: z.string(),
  groupLabel: z.string(),
  parentGroupKey: z.enum(['contribuicoes', 'outras-receitas']),
  parentGroupLabel: z.string(),
  total: z.string()
});

const IncomePivotRowSchema = z.object({
  referenceDate: z.string(),
  cells: z.record(z.string(), z.string()),
  total: z.string()
});

const IncomePivotSchema = z.object({
  columns: z.array(IncomePivotColumnSchema),
  rows: z.array(IncomePivotRowSchema),
  grandTotal: z.string()
});

export const FinancialStatementResponseSchema = z.object({
  period: PeriodSchema,
  openingBalance: z.string(),
  totalIncome: z.string(),
  totalExpenses: z.string(),
  currentBalance: z.string(),
  incomeByCategory: z.array(IncomeByCategoryRowSchema),
  incomeByCampaign: z.array(IncomeByCampaignRowSchema),
  expensesByCategory: z.array(ExpenseByCategoryRowSchema)
});

export const DetailedFinancialStatementResponseSchema = z.object({
  period: PeriodSchema,
  openingBalance: z.string(),
  totalIncome: z.string(),
  totalExpenses: z.string(),
  currentBalance: z.string(),
  incomePivot: IncomePivotSchema,
  incomeEntries: z.array(IncomeReportRowSchema),
  expenseEntries: z.array(ExpenseReportRowSchema)
});

export const AttendersReportResponseSchema = z.object({
  period: PeriodSchema,
  totalActiveAttenders: z.number().int().nonnegative(),
  tithe: z.object({
    attendersWhoContributed: z.number().int().nonnegative(),
    percentage: z.string()
  }),
  offerings: z.object({
    attendersWhoContributed: z.number().int().nonnegative(),
    percentage: z.string(),
    note: z.string()
  })
});

const CampaignSummarySchema = z.object({
  campaignId: z.number().int().positive(),
  campaignName: z.string(),
  targetAmount: z.string().nullable(),
  totalRaised: z.string(),
  totalExpenses: z.string(),
  balance: z.string(),
  progressPercentage: z.string().nullable()
});

export const CampaignListResponseSchema = z.object({
  period: PeriodSchema.nullable(),
  campaigns: z.array(CampaignSummarySchema)
});

const CampaignIncomeEntrySchema = z.object({
  id: z.number().int().positive(),
  referenceDate: z.string(),
  amount: z.string(),
  categoryName: z.string(),
  attenderName: z.string().nullable(),
  notes: z.string().nullable()
});

const CampaignExpenseEntrySchema = z.object({
  id: z.number().int().positive(),
  date: z.string(),
  amount: z.string(),
  categoryName: z.string(),
  notes: z.string().nullable()
});

export const CampaignDetailResponseSchema = CampaignSummarySchema.extend({
  period: PeriodSchema.nullable(),
  incomeEntries: z.array(CampaignIncomeEntrySchema),
  expenseEntries: z.array(CampaignExpenseEntrySchema)
});

const EventSummarySchema = z.object({
  eventId: z.number().int().positive(),
  eventTitle: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalRaised: z.string(),
  totalSpent: z.string(),
  net: z.string()
});

export const EventListResponseSchema = z.object({
  period: PeriodSchema.nullable(),
  events: z.array(EventSummarySchema)
});

const EventIncomeEntrySchema = z.object({
  id: z.number().int().positive(),
  referenceDate: z.string(),
  amount: z.string(),
  categoryName: z.string(),
  attenderName: z.string().nullable(),
  notes: z.string().nullable()
});

const EventExpenseEntrySchema = z.object({
  id: z.number().int().positive(),
  date: z.string(),
  amount: z.string(),
  categoryName: z.string(),
  notes: z.string().nullable()
});

export const EventDetailResponseSchema = EventSummarySchema.extend({
  period: PeriodSchema.nullable(),
  incomeEntries: z.array(EventIncomeEntrySchema),
  expenseEntries: z.array(EventExpenseEntrySchema)
});

export type IncomeReportRow = z.infer<typeof IncomeReportRowSchema>;
export type IncomeReportResponse = z.infer<typeof IncomeReportResponseSchema>;
export type ExpenseReportRow = z.infer<typeof ExpenseReportRowSchema>;
export type ExpenseReportResponse = z.infer<typeof ExpenseReportResponseSchema>;
export type IncomeByCategoryRow = z.infer<typeof IncomeByCategoryRowSchema>;
export type ExpenseByCategoryRow = z.infer<typeof ExpenseByCategoryRowSchema>;
export type IncomeByCampaignRow = z.infer<typeof IncomeByCampaignRowSchema>;
export type IncomeAggregateRow = {
  referenceDate: string;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  campaignId: number | null;
  campaignName: string | null;
  total: string;
};
export type IncomePivotColumn = z.infer<typeof IncomePivotColumnSchema>;
export type IncomePivotRow = z.infer<typeof IncomePivotRowSchema>;
export type IncomePivot = z.infer<typeof IncomePivotSchema>;
export type FinancialStatementResponse = z.infer<typeof FinancialStatementResponseSchema>;
export type DetailedFinancialStatementResponse = z.infer<
  typeof DetailedFinancialStatementResponseSchema
>;
export type AttendersReportResponse = z.infer<typeof AttendersReportResponseSchema>;
export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;
export type CampaignListResponse = z.infer<typeof CampaignListResponseSchema>;
export type CampaignIncomeEntry = z.infer<typeof CampaignIncomeEntrySchema>;
export type CampaignExpenseEntry = z.infer<typeof CampaignExpenseEntrySchema>;
export type CampaignDetailResponse = z.infer<typeof CampaignDetailResponseSchema>;
export type EventSummary = z.infer<typeof EventSummarySchema>;
export type EventListResponse = z.infer<typeof EventListResponseSchema>;
export type EventIncomeEntry = z.infer<typeof EventIncomeEntrySchema>;
export type EventExpenseEntry = z.infer<typeof EventExpenseEntrySchema>;
export type EventDetailResponse = z.infer<typeof EventDetailResponseSchema>;
