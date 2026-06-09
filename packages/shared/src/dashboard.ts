export type KpiDelta = {
  current: string;
  previous: string;
  deltaPct: string;
};

export type KpiDeltaType = KpiDelta;

export type FinanceKpis = {
  income: KpiDelta;
  expenses: KpiDelta;
  netResult: KpiDelta;
  cashBalance: {
    current: string;
    asOf: string;
  };
  pendingCounts: {
    income: number;
    expenses: number;
  };
};

export type ParticipationMetric = {
  currentPct: string;
  sixMonthAvgPct: string;
  deltaPct: string;
};

export type Participation = {
  tithe: ParticipationMetric;
  offering: ParticipationMetric;
};

export type MonthlyTrend = {
  month: string;
  income: string;
  expenses: string;
  titheAmount: string;
  offeringAmount: string;
  donationAmount: string;
  titheCount: number;
  offeringCount: number;
  donationCount: number;
};

export type Trends = {
  monthly: MonthlyTrend[];
};

export type Closing = {
  currentMonthId: number | null;
  status: 'aberto' | 'em revisão' | 'rejeitado' | 'aprovado' | 'fechado' | null;
  runningBalance: string;
  closingBalance: string | null;
  priorPendingCount: number;
  oldestPendingId: number | null;
};

export type CampaignSummary = {
  campaignId: number;
  campaignName: string;
  targetAmount: string | null;
  totalRaised: string;
  totalExpenses: string;
  balance: string;
  progressPercentage: string | null;
};

export type EventSummary = {
  eventId: number;
  eventTitle: string;
  startTime: string;
  endTime: string;
  totalSpent: string;
  totalRaised: string;
  net: string;
};

export type Events = {
  recent: EventSummary[];
  summary: {
    count: number;
    totalRaised: string;
    totalSpent: string;
    totalNet: string;
  };
};

export type DashboardResponse = {
  month: string;
  finance: FinanceKpis;
  participation: Participation;
  trends: Trends;
  closing: Closing;
  campaigns: CampaignSummary[];
  events: Events;
};
