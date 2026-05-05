import { z } from 'zod';

export const DateRangeQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date()
});

export const PaginatedDateRangeQuerySchema = DateRangeQuerySchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type PaginatedDateRangeQuery = z.infer<typeof PaginatedDateRangeQuerySchema>;

export type IncomeReportRow = {
  referenceDate: string;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  fundId: number | null;
  fundName: string | null;
  total: string;
};

export type IncomeAggregateRow = {
  referenceDate: string;
  columnKind: 'category' | 'fund';
  columnRefId: number;
  columnLabel: string;
  total: string;
};

export type IncomePivotColumn = {
  key: string;
  label: string;
  kind: 'category' | 'fund';
  refId: number;
  total: string;
};

export type IncomePivotRow = {
  referenceDate: string;
  cells: Record<string, string>;
  total: string;
};

export type IncomePivot = {
  columns: IncomePivotColumn[];
  rows: IncomePivotRow[];
  grandTotal: string;
};

export type IncomeReportResponse = {
  period: { from: string; to: string };
  totalIncome: string;
  data: IncomeReportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ExpenseReportRow = {
  id: number;
  referenceDate: string;
  description: string;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  fundId: number | null;
  fundName: string | null;
  amount: string;
};

export type ExpenseReportResponse = {
  period: { from: string; to: string };
  totalExpenses: string;
  data: ExpenseReportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type IncomeByCategoryRow = {
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  categoryId: number;
  categoryName: string;
  total: string;
};

export type ExpenseByCategoryRow = {
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  categoryId: number;
  categoryName: string;
  total: string;
};

export type IncomeByFundRow = {
  fundId: number;
  fundName: string;
  total: string;
};

export type FinancialStatementResponse = {
  period: { from: string; to: string };
  openingBalance: string;
  totalIncome: string;
  totalExpenses: string;
  currentBalance: string;
  incomeByCategory: IncomeByCategoryRow[];
  incomeByFund: IncomeByFundRow[];
  expensesByCategory: ExpenseByCategoryRow[];
};

export type DetailedFinancialStatementResponse = {
  period: { from: string; to: string };
  openingBalance: string;
  totalIncome: string;
  totalExpenses: string;
  currentBalance: string;
  incomePivot: IncomePivot;
  expenseEntries: ExpenseReportRow[];
};

export type MembersReportResponse = {
  period: { from: string; to: string };
  totalActiveMembers: number;
  tithe: {
    membersWhoContributed: number;
    percentage: string;
  };
  offerings: {
    membersWhoContributed: number;
    percentage: string;
    note: string;
  };
};

export type FundSummary = {
  fundId: number;
  fundName: string;
  targetAmount: string | null;
  totalRaised: string;
  totalExpenses: string;
  balance: string;
  progressPercentage: string | null;
};

export type FundListResponse = {
  funds: FundSummary[];
};

export type FundIncomeEntry = {
  id: number;
  referenceDate: string;
  amount: string;
  categoryName: string;
  memberName: string | null;
  notes: string | null;
};

export type FundExpenseEntry = {
  id: number;
  referenceDate: string;
  description: string;
  amount: string;
  categoryName: string;
  notes: string | null;
};

export type FundDetailResponse = FundSummary & {
  incomeEntries: FundIncomeEntry[];
  expenseEntries: FundExpenseEntry[];
};
