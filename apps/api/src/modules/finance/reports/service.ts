import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import * as repo from './repository.js';
import {
  findPreviousFechadoClosing,
  sumNetForDateRange,
  findFinanceSettings,
  periodEnd
} from '../monthly-closings/repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { Module, Action } from '../../../lib/constants.js';
import { httpError } from '../../../lib/errors.js';
import { getChurchSettings } from '../../church-settings/repository.js';
import {
  toChurchPdfData,
  loadChurchLogo,
  type ChurchPdfData,
  type PdfLogo
} from '../../../lib/pdf/church.js';
import { FinancialStatementPdf, DetailedFinancialStatementPdf } from './pdf-template.js';
import type {
  IncomeReportResponse,
  ExpenseReportResponse,
  FinancialStatementResponse,
  DetailedFinancialStatementResponse,
  AttendersReportResponse,
  CampaignListResponse,
  CampaignDetailResponse,
  CampaignSummary,
  EventListResponse,
  EventDetailResponse,
  EventSummary,
  IncomePivot,
  IncomePivotColumn,
  IncomePivotRow,
  IncomeAggregateRow
} from './schema.js';

export function computeCurrentBalance(opening: string, income: string, expenses: string): string {
  return (
    Number.parseFloat(opening) +
    Number.parseFloat(income) -
    Number.parseFloat(expenses)
  ).toFixed(2);
}

function monthToRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate(); // m is 1-based; this gives last day of month m
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
  const to = isCurrentMonth
    ? today.toISOString().slice(0, 10)
    : `${month}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function buildCampaignSummary(
  campaignId: number,
  campaignName: string,
  targetAmount: string | null,
  raised: string,
  expenses: string
): CampaignSummary {
  const balance = (Number.parseFloat(raised) - Number.parseFloat(expenses)).toFixed(2);
  const progressPercentage =
    targetAmount !== null && Number.parseFloat(targetAmount) > 0
      ? ((Number.parseFloat(balance) / Number.parseFloat(targetAmount)) * 100).toFixed(2)
      : null;
  return {
    campaignId,
    campaignName,
    targetAmount,
    totalRaised: raised,
    totalExpenses: expenses,
    balance,
    progressPercentage
  };
}

export async function computeOpeningBalance(from: string): Promise<string> {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const lastFechado = await findPreviousFechadoClosing(fromYear, fromMonth);

  let baseBal: string;
  let rangeStart: string;

  if (lastFechado) {
    baseBal = lastFechado.closingBalance ?? '0';
    rangeStart = periodEnd(lastFechado.periodYear, lastFechado.periodMonth);
  } else {
    const settings = await findFinanceSettings();
    baseBal = settings?.openingBalance ?? '0';
    rangeStart = '2020-01-01';
  }

  const prevYear = fromMonth === 1 ? fromYear - 1 : fromYear;
  const prevMonth = fromMonth === 1 ? 12 : fromMonth - 1;
  const lastFechadoIsPrevMonth =
    lastFechado?.periodYear === prevYear && lastFechado?.periodMonth === prevMonth;

  if (!lastFechadoIsPrevMonth) {
    const intermediateNet = await sumNetForDateRange(rangeStart, from);
    return (Number.parseFloat(baseBal) + Number.parseFloat(intermediateNet)).toFixed(2);
  }

  return baseBal;
}

export async function getIncomeReport(
  callerId: number,
  month: string,
  page: number,
  limit: number,
  status?: 'pendente' | 'paga' | 'cancelada'
): Promise<IncomeReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from, to } = monthToRange(month);

  const offset = (page - 1) * limit;
  const [rows, rowCount, totalIncome] = await Promise.all([
    repo.getIncomeReportRows(from, to, offset, limit, status),
    repo.countIncomeReportRows(from, to, status),
    repo.sumIncomeForRange(from, to, status)
  ]);

  const totalPages = Math.ceil(rowCount / limit) || 1;
  return {
    period: { from, to },
    totalIncome,
    data: rows,
    total: rowCount,
    page,
    limit,
    totalPages
  };
}

export async function getExpenseReport(
  callerId: number,
  month: string,
  page: number,
  limit: number,
  status?: 'pendente' | 'paga' | 'cancelada'
): Promise<ExpenseReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from, to } = monthToRange(month);

  const offset = (page - 1) * limit;
  const [rows, rowCount, totalExpenses] = await Promise.all([
    repo.getExpenseReportRows(from, to, offset, limit, status),
    repo.countExpenseReportRows(from, to, status),
    repo.sumExpensesForRange(from, to, status)
  ]);

  const totalPages = Math.ceil(rowCount / limit) || 1;
  return {
    period: { from, to },
    totalExpenses,
    data: rows,
    total: rowCount,
    page,
    limit,
    totalPages
  };
}

export async function getFinancialStatement(
  callerId: number,
  month: string
): Promise<FinancialStatementResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from, to } = monthToRange(month);

  const [
    incomeByCategory,
    incomeByCampaign,
    expensesByCategory,
    totalIncome,
    totalExpenses,
    openingBalance
  ] = await Promise.all([
    repo.getIncomeByCategoryForRange(from, to),
    repo.getIncomeByCampaignForRange(from, to),
    repo.getExpensesByCategoryForRange(from, to),
    repo.sumIncomeForRange(from, to),
    repo.sumExpensesForRange(from, to),
    computeOpeningBalance(from)
  ]);

  const currentBalance = computeCurrentBalance(openingBalance, totalIncome, totalExpenses);

  return {
    period: { from, to },
    openingBalance,
    totalIncome,
    totalExpenses,
    currentBalance,
    incomeByCategory,
    incomeByCampaign,
    expensesByCategory
  };
}

export async function getAttendersReport(
  callerId: number,
  month: string
): Promise<AttendersReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from: fromDate, to: toDate } = monthToRange(month);

  const [titheIds, offeringIds] = await Promise.all([
    repo.findIncomeCategoryIdsByNames(['Dízimo']),
    repo.findIncomeCategoryIdsByNames(['Oferta', 'Doação'])
  ]);

  const [totalActiveAttenders, tithePayers, offeringPayers] = await Promise.all([
    repo.countActiveAttenders(),
    repo.countDistinctAttendersWithTithe(fromDate, toDate, titheIds),
    repo.countDistinctAttendersWithOfferings(fromDate, toDate, offeringIds)
  ]);

  const tithePercentage =
    totalActiveAttenders > 0 ? ((tithePayers / totalActiveAttenders) * 100).toFixed(2) : '0.00';
  const offeringPercentage =
    totalActiveAttenders > 0 ? ((offeringPayers / totalActiveAttenders) * 100).toFixed(2) : '0.00';

  return {
    period: { from: fromDate, to: toDate },
    totalActiveAttenders,
    tithe: {
      attendersWhoContributed: tithePayers,
      percentage: tithePercentage
    },
    offerings: {
      attendersWhoContributed: offeringPayers,
      percentage: offeringPercentage,
      note: 'Only counts entries where attenderId was explicitly set'
    }
  };
}

export async function getCampaignList(
  callerId: number,
  month?: string
): Promise<CampaignListResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  if (month) {
    const period = monthToRange(month);
    const [campaigns, income, expenses] = await Promise.all([
      repo.findAllActiveCampaigns(),
      repo.sumIncomePerCampaignForRange(period.from, period.to),
      repo.sumExpensesPerCampaignForRange(period.from, period.to)
    ]);
    return {
      period,
      campaigns: campaigns.map((f) => {
        const raised = income.get(f.id) ?? '0.00';
        const expensesVal = expenses.get(f.id) ?? '0.00';
        return buildCampaignSummary(f.id, f.name, f.targetAmount ?? null, raised, expensesVal);
      })
    };
  } else {
    const [campaigns, income, expenses] = await Promise.all([
      repo.findAllActiveCampaigns(),
      repo.sumAllTimeIncomePerCampaign(),
      repo.sumAllTimeExpensesPerCampaign()
    ]);
    return {
      period: null,
      campaigns: campaigns.map((f) => {
        const raised = income.get(f.id) ?? '0.00';
        const expensesVal = expenses.get(f.id) ?? '0.00';
        return buildCampaignSummary(f.id, f.name, f.targetAmount ?? null, raised, expensesVal);
      })
    };
  }
}

export async function getCampaignDetail(
  callerId: number,
  id: number,
  month?: string
): Promise<CampaignDetailResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  const campaign = await repo.findCampaignById(id);
  if (!campaign) throw httpError(404, 'Campaign not found');

  if (month) {
    const period = monthToRange(month);
    const [incomeEntries, expenseEntries, totalRaised, totalExpenses] = await Promise.all([
      repo.getCampaignIncomeEntriesForRange(id, period.from, period.to),
      repo.getCampaignExpenseEntriesForRange(id, period.from, period.to),
      repo.sumIncomeForCampaignRange(id, period.from, period.to),
      repo.sumExpensesForCampaignRange(id, period.from, period.to)
    ]);

    const summary = buildCampaignSummary(
      campaign.id,
      campaign.name,
      campaign.targetAmount ?? null,
      totalRaised,
      totalExpenses
    );

    return { ...summary, period, incomeEntries, expenseEntries };
  } else {
    const [incomeEntries, expenseEntries, totalRaised, totalExpenses] = await Promise.all([
      repo.getCampaignIncomeEntries(id),
      repo.getCampaignExpenseEntries(id),
      repo.sumAllTimeIncomeForCampaign(id),
      repo.sumAllTimeExpensesForCampaign(id)
    ]);

    const summary = buildCampaignSummary(
      campaign.id,
      campaign.name,
      campaign.targetAmount ?? null,
      totalRaised,
      totalExpenses
    );

    return { ...summary, period: null, incomeEntries, expenseEntries };
  }
}

function buildEventSummary(
  eventId: number,
  eventTitle: string,
  startTime: Date,
  endTime: Date,
  raised: string,
  spent: string
): EventSummary {
  const net = (Number.parseFloat(raised) - Number.parseFloat(spent)).toFixed(2);
  return {
    eventId,
    eventTitle,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    totalRaised: raised,
    totalSpent: spent,
    net
  };
}

export async function getEventList(callerId: number, month?: string): Promise<EventListResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  if (month) {
    const period = monthToRange(month);
    const [evts, income, expenses] = await Promise.all([
      repo.findAllActiveEvents(),
      repo.sumIncomePerEventForRange(period.from, period.to),
      repo.sumExpensesPerEventForRange(period.from, period.to)
    ]);
    return {
      period,
      events: evts.map((e) =>
        buildEventSummary(
          e.id,
          e.title,
          e.startTime,
          e.endTime,
          income.get(e.id) ?? '0.00',
          expenses.get(e.id) ?? '0.00'
        )
      )
    };
  } else {
    const [evts, income, expenses] = await Promise.all([
      repo.findAllActiveEvents(),
      repo.sumAllTimeIncomePerEvent(),
      repo.sumAllTimeExpensesPerEvent()
    ]);
    return {
      period: null,
      events: evts.map((e) =>
        buildEventSummary(
          e.id,
          e.title,
          e.startTime,
          e.endTime,
          income.get(e.id) ?? '0.00',
          expenses.get(e.id) ?? '0.00'
        )
      )
    };
  }
}

export async function getEventDetail(
  callerId: number,
  id: number,
  month?: string
): Promise<EventDetailResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  const evt = await repo.findEventByIdForReport(id);
  if (!evt) throw httpError(404, 'Event not found');

  if (month) {
    const period = monthToRange(month);
    const [incomeEntries, expenseEntries, totalRaised, totalSpent] = await Promise.all([
      repo.getEventIncomeEntriesForRange(id, period.from, period.to),
      repo.getEventExpenseEntriesForRange(id, period.from, period.to),
      repo.sumIncomeForEventRange(id, period.from, period.to),
      repo.sumExpensesForEventRange(id, period.from, period.to)
    ]);
    const summary = buildEventSummary(
      evt.id,
      evt.title,
      evt.startTime,
      evt.endTime,
      totalRaised,
      totalSpent
    );
    return { ...summary, period, incomeEntries, expenseEntries };
  } else {
    const [incomeEntries, expenseEntries, totalRaised, totalSpent] = await Promise.all([
      repo.getEventIncomeEntries(id),
      repo.getEventExpenseEntries(id),
      repo.sumAllTimeIncomeForEvent(id),
      repo.sumAllTimeExpensesForEvent(id)
    ]);
    const summary = buildEventSummary(
      evt.id,
      evt.title,
      evt.startTime,
      evt.endTime,
      totalRaised,
      totalSpent
    );
    return { ...summary, period: null, incomeEntries, expenseEntries };
  }
}

async function loadChurchForPdf(): Promise<{ church: ChurchPdfData; logo?: PdfLogo }> {
  const settings = await getChurchSettings();
  if (!settings) throw httpError(409, 'Church settings not initialized');
  return { church: toChurchPdfData(settings), logo: await loadChurchLogo(settings.logoPath) };
}

export async function renderFinancialStatementPdf(
  callerId: number,
  month: string
): Promise<Buffer> {
  const data = await getFinancialStatement(callerId, month);
  const { church, logo } = await loadChurchForPdf();
  return renderToBuffer(
    React.createElement(FinancialStatementPdf, {
      data,
      church,
      logo
    }) as React.ReactElement<DocumentProps>
  );
}

type ParentGroupKey = 'contribuicoes' | 'outras-receitas';

type ColumnSpec = {
  groupKey: 'dizimo' | 'oferta' | 'doacao' | 'eventos' | 'outros';
  groupLabel: string;
  parentGroupKey: ParentGroupKey;
  parentGroupLabel: string;
  splitByCampaign: boolean;
  matches: (agg: IncomeAggregateRow) => boolean;
};

const COLUMN_SPEC: ColumnSpec[] = [
  {
    groupKey: 'dizimo',
    groupLabel: 'Dízimo',
    parentGroupKey: 'contribuicoes',
    parentGroupLabel: 'Contribuições',
    splitByCampaign: false,
    matches: (a) => a.categoryName === 'Dízimo'
  },
  {
    groupKey: 'oferta',
    groupLabel: 'Oferta',
    parentGroupKey: 'contribuicoes',
    parentGroupLabel: 'Contribuições',
    splitByCampaign: false,
    matches: (a) => a.categoryName === 'Oferta'
  },
  {
    groupKey: 'doacao',
    groupLabel: 'Doação',
    parentGroupKey: 'contribuicoes',
    parentGroupLabel: 'Contribuições',
    splitByCampaign: true,
    matches: (a) => a.categoryName === 'Doação'
  },
  {
    groupKey: 'eventos',
    groupLabel: 'Eventos',
    parentGroupKey: 'outras-receitas',
    parentGroupLabel: 'Outras Receitas',
    splitByCampaign: false,
    matches: (a) => a.categoryName === 'Eventos'
  },
  {
    groupKey: 'outros',
    groupLabel: 'Outros rendimentos',
    parentGroupKey: 'outras-receitas',
    parentGroupLabel: 'Outras Receitas',
    splitByCampaign: false,
    matches: (a) => a.parentCategoryName === 'Outras Receitas' && a.categoryName !== 'Eventos'
  }
];

export function buildIncomePivot(aggregates: IncomeAggregateRow[]): IncomePivot {
  // Map each aggregate to the spec it matches (first-match wins).
  type Tagged = { spec: ColumnSpec; agg: IncomeAggregateRow };
  const tagged: Tagged[] = [];
  for (const agg of aggregates) {
    const spec = COLUMN_SPEC.find((s) => s.matches(agg));
    if (spec) tagged.push({ spec, agg });
  }

  // Resolve the per-row key for each tagged aggregate (leaf column key).
  // - splitByCampaign=false → just the groupKey
  // - splitByCampaign=true → 'doacao:campaign:<id>' or 'doacao:sem-campanha'
  const leafKey = (t: Tagged): string => {
    if (!t.spec.splitByCampaign) return t.spec.groupKey;
    if (t.agg.campaignId == null) return `${t.spec.groupKey}:sem-campanha`;
    return `${t.spec.groupKey}:campaign:${t.agg.campaignId}`;
  };
  const leafLabel = (t: Tagged): string => {
    if (!t.spec.splitByCampaign) return t.spec.groupLabel;
    if (t.agg.campaignId == null) return 'Sem campanha';
    return t.agg.campaignName ?? 'Sem campanha';
  };

  // Build per-column totals + per-row cells in one pass.
  const columnMap = new Map<string, IncomePivotColumn>();
  const rowMap = new Map<string, IncomePivotRow>();

  for (const t of tagged) {
    const key = leafKey(t);
    if (!columnMap.has(key)) {
      columnMap.set(key, {
        key,
        label: leafLabel(t),
        groupKey: t.spec.groupKey,
        groupLabel: t.spec.groupLabel,
        parentGroupKey: t.spec.parentGroupKey,
        parentGroupLabel: t.spec.parentGroupLabel,
        total: '0.00'
      });
    }
    const col = columnMap.get(key)!;
    col.total = (parseFloat(col.total) + parseFloat(t.agg.total)).toFixed(2);

    if (!rowMap.has(t.agg.referenceDate)) {
      rowMap.set(t.agg.referenceDate, {
        referenceDate: t.agg.referenceDate,
        cells: {},
        total: '0.00'
      });
    }
    const row = rowMap.get(t.agg.referenceDate)!;
    const cells = row.cells as Record<string, string>;
    cells[key] = (parseFloat(cells[key] ?? '0') + parseFloat(t.agg.total)).toFixed(2);
    row.total = (parseFloat(row.total) + parseFloat(t.agg.total)).toFixed(2);
  }

  // Hide zero-total columns + sort by COLUMN_SPEC order, then alpha within Doação campaign sub-cols.
  const specOrder = new Map(COLUMN_SPEC.map((s, i) => [s.groupKey, i]));
  const columns = [...columnMap.values()]
    .filter((c) => parseFloat(c.total) !== 0)
    .sort((a, b) => {
      const ga = specOrder.get(a.groupKey as ColumnSpec['groupKey']) ?? 999;
      const gb = specOrder.get(b.groupKey as ColumnSpec['groupKey']) ?? 999;
      if (ga !== gb) return ga - gb;
      // Within the same group (e.g. Doação campaign sub-cols), 'Sem campanha' last, then alpha.
      const aSem = a.key.endsWith(':sem-campanha');
      const bSem = b.key.endsWith(':sem-campanha');
      if (aSem !== bSem) return aSem ? 1 : -1;
      return a.label.localeCompare(b.label, 'pt-BR');
    });

  const rows = [...rowMap.values()].sort((a, b) => a.referenceDate.localeCompare(b.referenceDate));
  const grandTotal = rows.reduce((s, r) => s + parseFloat(r.total), 0).toFixed(2);

  return { columns, rows, grandTotal };
}

export async function getDetailedFinancialStatement(
  callerId: number,
  month: string
): Promise<DetailedFinancialStatementResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from, to } = monthToRange(month);

  const [
    incomeEntries,
    incomeAggregates,
    expenseEntries,
    totalIncome,
    totalExpenses,
    openingBalance
  ] = await Promise.all([
    repo.getAllIncomeReportRows(from, to),
    repo.getIncomeAggregatesForRange(from, to),
    repo.getAllExpenseReportRows(from, to),
    repo.sumIncomeForRange(from, to),
    repo.sumExpensesForRange(from, to),
    computeOpeningBalance(from)
  ]);

  const currentBalance = computeCurrentBalance(openingBalance, totalIncome, totalExpenses);
  const incomePivot = buildIncomePivot(incomeAggregates);

  return {
    period: { from, to },
    openingBalance,
    totalIncome,
    totalExpenses,
    currentBalance,
    incomePivot,
    incomeEntries,
    expenseEntries
  };
}

export async function renderDetailedFinancialStatementPdf(
  callerId: number,
  month: string
): Promise<Buffer> {
  const data = await getDetailedFinancialStatement(callerId, month);
  const { church, logo } = await loadChurchForPdf();
  return renderToBuffer(
    React.createElement(DetailedFinancialStatementPdf, {
      data,
      church,
      logo
    }) as React.ReactElement<DocumentProps>
  );
}
