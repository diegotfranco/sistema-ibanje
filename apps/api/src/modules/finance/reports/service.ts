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
import { FinancialStatementPdf, DetailedFinancialStatementPdf } from './pdf-template.js';
import type {
  IncomeReportResponse,
  ExpenseReportResponse,
  FinancialStatementResponse,
  DetailedFinancialStatementResponse,
  AttendersReportResponse,
  FundListResponse,
  FundDetailResponse,
  FundSummary,
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

function buildFundSummary(
  fundId: number,
  fundName: string,
  targetAmount: string | null,
  raised: string,
  expenses: string
): FundSummary {
  const balance = (Number.parseFloat(raised) - Number.parseFloat(expenses)).toFixed(2);
  const progressPercentage =
    targetAmount !== null && Number.parseFloat(targetAmount) > 0
      ? ((Number.parseFloat(balance) / Number.parseFloat(targetAmount)) * 100).toFixed(2)
      : null;
  return {
    fundId,
    fundName,
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
    incomeByFund,
    expensesByCategory,
    totalIncome,
    totalExpenses,
    openingBalance
  ] = await Promise.all([
    repo.getIncomeByCategoryForRange(from, to),
    repo.getIncomeByFundForRange(from, to),
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
    incomeByFund,
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
    repo.findIncomeCategoryIdsByNames(['Oferta de Culto', 'Oferta Missionária', 'Doação'])
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

export async function getFundList(callerId: number, month?: string): Promise<FundListResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  if (month) {
    const period = monthToRange(month);
    const [funds, income, expenses] = await Promise.all([
      repo.findAllActiveFunds(),
      repo.sumIncomePerFundForRange(period.from, period.to),
      repo.sumExpensesPerFundForRange(period.from, period.to)
    ]);
    return {
      period,
      funds: funds.map((f) => {
        const raised = income.get(f.id) ?? '0.00';
        const expensesVal = expenses.get(f.id) ?? '0.00';
        return buildFundSummary(f.id, f.name, f.targetAmount ?? null, raised, expensesVal);
      })
    };
  } else {
    const [funds, income, expenses] = await Promise.all([
      repo.findAllActiveFunds(),
      repo.sumAllTimeIncomePerFund(),
      repo.sumAllTimeExpensesPerFund()
    ]);
    return {
      period: null,
      funds: funds.map((f) => {
        const raised = income.get(f.id) ?? '0.00';
        const expensesVal = expenses.get(f.id) ?? '0.00';
        return buildFundSummary(f.id, f.name, f.targetAmount ?? null, raised, expensesVal);
      })
    };
  }
}

export async function getFundDetail(
  callerId: number,
  id: number,
  month?: string
): Promise<FundDetailResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  const fund = await repo.findFundById(id);
  if (!fund) throw httpError(404, 'Fund not found');

  if (month) {
    const period = monthToRange(month);
    const [incomeEntries, expenseEntries, totalRaised, totalExpenses] = await Promise.all([
      repo.getFundIncomeEntriesForRange(id, period.from, period.to),
      repo.getFundExpenseEntriesForRange(id, period.from, period.to),
      repo.sumIncomeForFundRange(id, period.from, period.to),
      repo.sumExpensesForFundRange(id, period.from, period.to)
    ]);

    const summary = buildFundSummary(
      fund.id,
      fund.name,
      fund.targetAmount ?? null,
      totalRaised,
      totalExpenses
    );

    return { ...summary, period, incomeEntries, expenseEntries };
  } else {
    const [incomeEntries, expenseEntries, totalRaised, totalExpenses] = await Promise.all([
      repo.getFundIncomeEntries(id),
      repo.getFundExpenseEntries(id),
      repo.sumAllTimeIncomeForFund(id),
      repo.sumAllTimeExpensesForFund(id)
    ]);

    const summary = buildFundSummary(
      fund.id,
      fund.name,
      fund.targetAmount ?? null,
      totalRaised,
      totalExpenses
    );

    return { ...summary, period: null, incomeEntries, expenseEntries };
  }
}

export async function renderFinancialStatementPdf(
  callerId: number,
  month: string
): Promise<Buffer> {
  const data = await getFinancialStatement(callerId, month);
  return renderToBuffer(
    React.createElement(FinancialStatementPdf, { data }) as React.ReactElement<DocumentProps>
  );
}

type ParentGroupKey = 'contribuicoes' | 'outras-receitas';

type ColumnSpec = {
  groupKey: 'dizimo' | 'oferta' | 'doacao' | 'eventos' | 'outros';
  groupLabel: string;
  parentGroupKey: ParentGroupKey;
  parentGroupLabel: string;
  splitByFund: boolean;
  matches: (agg: IncomeAggregateRow) => boolean;
};

const COLUMN_SPEC: ColumnSpec[] = [
  {
    groupKey: 'dizimo',
    groupLabel: 'Dízimo',
    parentGroupKey: 'contribuicoes',
    parentGroupLabel: 'Contribuições',
    splitByFund: false,
    matches: (a) => a.categoryName === 'Dízimo'
  },
  {
    groupKey: 'oferta',
    groupLabel: 'Oferta',
    parentGroupKey: 'contribuicoes',
    parentGroupLabel: 'Contribuições',
    splitByFund: false,
    matches: (a) => a.categoryName === 'Oferta'
  },
  {
    groupKey: 'doacao',
    groupLabel: 'Doação',
    parentGroupKey: 'contribuicoes',
    parentGroupLabel: 'Contribuições',
    splitByFund: true,
    matches: (a) => a.categoryName === 'Doação'
  },
  {
    groupKey: 'eventos',
    groupLabel: 'Eventos',
    parentGroupKey: 'outras-receitas',
    parentGroupLabel: 'Outras Receitas',
    splitByFund: false,
    matches: (a) => a.categoryName === 'Eventos'
  },
  {
    groupKey: 'outros',
    groupLabel: 'Outros rendimentos',
    parentGroupKey: 'outras-receitas',
    parentGroupLabel: 'Outras Receitas',
    splitByFund: false,
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
  // - splitByFund=false → just the groupKey
  // - splitByFund=true → 'doacao:fund:<id>' or 'doacao:sem-fundo'
  const leafKey = (t: Tagged): string => {
    if (!t.spec.splitByFund) return t.spec.groupKey;
    if (t.agg.fundId == null) return `${t.spec.groupKey}:sem-fundo`;
    return `${t.spec.groupKey}:fund:${t.agg.fundId}`;
  };
  const leafLabel = (t: Tagged): string => {
    if (!t.spec.splitByFund) return t.spec.groupLabel;
    if (t.agg.fundId == null) return 'Sem fundo';
    return t.agg.fundName ?? 'Sem fundo';
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

  // Hide zero-total columns + sort by COLUMN_SPEC order, then alpha within Doação fund sub-cols.
  const specOrder = new Map(COLUMN_SPEC.map((s, i) => [s.groupKey, i]));
  const columns = [...columnMap.values()]
    .filter((c) => parseFloat(c.total) !== 0)
    .sort((a, b) => {
      const ga = specOrder.get(a.groupKey as ColumnSpec['groupKey']) ?? 999;
      const gb = specOrder.get(b.groupKey as ColumnSpec['groupKey']) ?? 999;
      if (ga !== gb) return ga - gb;
      // Within the same group (e.g. Doação fund sub-cols), 'Sem fundo' last, then alpha.
      const aSem = a.key.endsWith(':sem-fundo');
      const bSem = b.key.endsWith(':sem-fundo');
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
  return renderToBuffer(
    React.createElement(DetailedFinancialStatementPdf, {
      data
    }) as React.ReactElement<DocumentProps>
  );
}
