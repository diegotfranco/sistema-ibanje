import { z } from 'zod';

export const MonthQueryRequestSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM')
});

export type MonthQueryRequest = z.infer<typeof MonthQueryRequestSchema>;

const KpiDeltaSchema = z.object({
  current: z.string(),
  previous: z.string(),
  deltaPct: z.string()
});

export type KpiDelta = z.infer<typeof KpiDeltaSchema>;

const FinanceKpisSchema = z.object({
  income: KpiDeltaSchema,
  expenses: KpiDeltaSchema,
  netResult: KpiDeltaSchema,
  cashBalance: z.object({
    current: z.string(),
    asOf: z.string()
  }),
  pendingCounts: z.object({
    income: z.number().int().nonnegative(),
    expenses: z.number().int().nonnegative()
  })
});

const ParticipationMetricSchema = z.object({
  currentPct: z.string(),
  sixMonthAvgPct: z.string(),
  deltaPct: z.string()
});

const ParticipationSchema = z.object({
  tithe: ParticipationMetricSchema,
  offering: ParticipationMetricSchema
});

const MonthlyTrendSchema = z.object({
  month: z.string(),
  income: z.string(),
  expenses: z.string(),
  titheAmount: z.string(),
  offeringAmount: z.string(),
  donationAmount: z.string(),
  titheCount: z.number().int().nonnegative(),
  offeringCount: z.number().int().nonnegative(),
  donationCount: z.number().int().nonnegative()
});

const TrendsSchema = z.object({
  monthly: z.array(MonthlyTrendSchema)
});

const ClosingSchema = z.object({
  currentMonthId: z.number().int().positive().nullable(),
  status: z.enum(['aberto', 'em revisão', 'rejeitado', 'aprovado', 'fechado']).nullable(),
  runningBalance: z.string(),
  closingBalance: z.string().nullable(),
  priorPendingCount: z.number().int().nonnegative(),
  oldestPendingId: z.number().int().positive().nullable()
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

const EventSummarySchema = z.object({
  eventId: z.number().int().positive(),
  eventTitle: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalSpent: z.string(),
  totalRaised: z.string(),
  net: z.string()
});

const EventsSchema = z.object({
  recent: z.array(EventSummarySchema),
  summary: z.object({
    count: z.number().int().nonnegative(),
    totalRaised: z.string(),
    totalSpent: z.string(),
    totalNet: z.string()
  })
});

export const DashboardResponseSchema = z.object({
  month: z.string(),
  // Finance sections are null when the caller lacks Module.Reports/Action.Report; the closing
  // section is null when they lack Module.MonthlyClosings/Action.View. The service skips the
  // underlying queries in those cases, so this isn't just a presentation filter.
  finance: FinanceKpisSchema.nullable(),
  participation: ParticipationSchema.nullable(),
  trends: TrendsSchema.nullable(),
  closing: ClosingSchema.nullable(),
  campaigns: z.array(CampaignSummarySchema).nullable(),
  events: EventsSchema.nullable()
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type KpiDeltaType = z.infer<typeof KpiDeltaSchema>;
export type FinanceKpis = z.infer<typeof FinanceKpisSchema>;
export type ParticipationMetric = z.infer<typeof ParticipationMetricSchema>;
export type Participation = z.infer<typeof ParticipationSchema>;
export type MonthlyTrend = z.infer<typeof MonthlyTrendSchema>;
export type Trends = z.infer<typeof TrendsSchema>;
export type Closing = z.infer<typeof ClosingSchema>;
export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;
export type EventSummary = z.infer<typeof EventSummarySchema>;
export type Events = z.infer<typeof EventsSchema>;
