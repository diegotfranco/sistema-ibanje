import { z } from 'zod';

export const ReportFilterSchema = z.object({
  from: z.string().min(1, 'Data inicial é obrigatória.'),
  to: z.string().min(1, 'Data final é obrigatória.')
});

export type ReportFilterValues = z.infer<typeof ReportFilterSchema>;

export type IncomeReportRow = {
  id: number;
  depositDate: string;
  referenceDate: string;
  amount: string;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  campaignId: number | null;
  campaignName: string | null;
  attenderId: number | null;
  attenderName: string | null;
  paymentMethodName: string;
  notes: string | null;
  status: 'pendente' | 'paga';
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
  date: string;
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  campaignId: number | null;
  campaignName: string | null;
  attenderId: number | null;
  attenderName: string | null;
  paymentMethodName: string;
  installment: number;
  totalInstallments: number;
  hasReceipt: boolean;
  notes: string | null;
  amount: string;
  status: 'pendente' | 'paga';
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

export type IncomeByCampaignRow = {
  campaignId: number;
  campaignName: string;
  total: string;
};

export type FinancialStatementResponse = {
  period: { from: string; to: string };
  openingBalance: string;
  totalIncome: string;
  totalExpenses: string;
  currentBalance: string;
  incomeByCategory: IncomeByCategoryRow[];
  incomeByCampaign: IncomeByCampaignRow[];
  expensesByCategory: ExpenseByCategoryRow[];
};

export type IncomePivotColumn = {
  key: string;
  label: string;
  groupKey: string;
  groupLabel: string;
  parentGroupKey: 'contribuicoes' | 'outras-receitas';
  parentGroupLabel: string;
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

export type DetailedFinancialStatementResponse = {
  period: { from: string; to: string };
  openingBalance: string;
  totalIncome: string;
  totalExpenses: string;
  currentBalance: string;
  incomePivot: IncomePivot;
  incomeEntries: IncomeReportRow[];
  expenseEntries: ExpenseReportRow[];
};

export type AttendersReportResponse = {
  period: { from: string; to: string };
  totalActiveAttenders: number;
  tithe: { attendersWhoContributed: number; percentage: string };
  offerings: { attendersWhoContributed: number; percentage: string; note: string };
};

export type CampaignSummary = {
  campaignId: number;
  campaignName: string;
  targetAmount: string | null;
  targetDate: string | null;
  totalRaised: string;
  totalExpenses: string;
  balance: string;
  progressPercentage: string | null;
};

export type CampaignListResponse = { campaigns: CampaignSummary[] };

export type CampaignIncomeEntry = {
  id: number;
  referenceDate: string;
  amount: string;
  categoryName: string;
  memberName: string | null;
  notes: string | null;
};

export type CampaignExpenseEntry = {
  id: number;
  date: string;
  amount: string;
  categoryName: string;
  notes: string | null;
};

export type EventSummary = {
  eventId: number;
  eventTitle: string;
  startTime: string;
  endTime: string;
  totalRaised: string;
  totalSpent: string;
  net: string;
};

export type EventListResponse = {
  period: { from: string; to: string } | null;
  events: EventSummary[];
};

export type CampaignDetailResponse = CampaignSummary & {
  incomeEntries: CampaignIncomeEntry[];
  expenseEntries: CampaignExpenseEntry[];
};
