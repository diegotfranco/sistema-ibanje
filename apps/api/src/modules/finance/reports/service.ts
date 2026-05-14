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
  MembersReportResponse,
  FundListResponse,
  FundDetailResponse,
  FundSummary,
  IncomePivot,
  IncomePivotColumn,
  IncomePivotRow,
  IncomeAggregateRow
} from './schema.js';

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

function buildIncomePivot(aggregates: IncomeAggregateRow[]): IncomePivot {
  const columnMap = new Map<string, IncomePivotColumn>();

  for (const agg of aggregates) {
    const key = `${agg.columnKind}:${agg.columnRefId}`;
    if (!columnMap.has(key)) {
      columnMap.set(key, {
        key,
        label: agg.columnLabel,
        kind: agg.columnKind,
        refId: agg.columnRefId,
        total: '0.00'
      });
    }
    const col = columnMap.get(key)!;
    col.total = (Number.parseFloat(col.total) + Number.parseFloat(agg.total)).toFixed(2);
  }

  const columns = [...columnMap.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'category' ? -1 : 1;
    return a.label.localeCompare(b.label, 'pt-BR');
  });

  const rowMap = new Map<string, IncomePivotRow>();
  for (const agg of aggregates) {
    const key = `${agg.columnKind}:${agg.columnRefId}`;
    if (!rowMap.has(agg.referenceDate)) {
      rowMap.set(agg.referenceDate, { referenceDate: agg.referenceDate, cells: {}, total: '0.00' });
    }
    const row = rowMap.get(agg.referenceDate)!;
    row.cells[key] = (Number.parseFloat(row.cells[key] ?? '0') + Number.parseFloat(agg.total)).toFixed(2);
    row.total = (Number.parseFloat(row.total) + Number.parseFloat(agg.total)).toFixed(2);
  }

  const rows = [...rowMap.values()].sort((a, b) => a.referenceDate.localeCompare(b.referenceDate));
  const grandTotal = rows.reduce((s, r) => s + Number.parseFloat(r.total), 0).toFixed(2);

  return { columns, rows, grandTotal };
}

async function computeOpeningBalance(from: string): Promise<string> {
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
  limit: number
): Promise<IncomeReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from, to } = monthToRange(month);

  const offset = (page - 1) * limit;
  const [rows, rowCount, totalIncome] = await Promise.all([
    repo.getIncomeReportRows(from, to, offset, limit),
    repo.countIncomeReportRows(from, to),
    repo.sumIncomeForRange(from, to)
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
  limit: number
): Promise<ExpenseReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from, to } = monthToRange(month);

  const offset = (page - 1) * limit;
  const [rows, rowCount, totalExpenses] = await Promise.all([
    repo.getExpenseReportRows(from, to, offset, limit),
    repo.countExpenseReportRows(from, to),
    repo.sumExpensesForRange(from, to)
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

  const currentBalance = (
    Number.parseFloat(openingBalance) +
    Number.parseFloat(totalIncome) -
    Number.parseFloat(totalExpenses)
  ).toFixed(2);

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

export async function getMembersReport(
  callerId: number,
  month: string
): Promise<MembersReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from: fromDate, to: toDate } = monthToRange(month);

  const [titheIds, offeringIds] = await Promise.all([
    repo.findIncomeCategoryIdsByNames(['Dízimo']),
    repo.findIncomeCategoryIdsByNames(['Oferta de Culto', 'Oferta Missionária', 'Doação'])
  ]);

  const [totalActiveMembers, tithePayers, offeringPayers] = await Promise.all([
    repo.countActiveMembers(),
    repo.countDistinctMembersWithTithe(fromDate, toDate, titheIds),
    repo.countDistinctMembersWithOfferings(fromDate, toDate, offeringIds)
  ]);

  const tithePercentage =
    totalActiveMembers > 0 ? ((tithePayers / totalActiveMembers) * 100).toFixed(2) : '0.00';
  const offeringPercentage =
    totalActiveMembers > 0 ? ((offeringPayers / totalActiveMembers) * 100).toFixed(2) : '0.00';

  return {
    period: { from: fromDate, to: toDate },
    totalActiveMembers,
    tithe: {
      membersWhoContributed: tithePayers,
      percentage: tithePercentage
    },
    offerings: {
      membersWhoContributed: offeringPayers,
      percentage: offeringPercentage,
      note: 'Only counts entries where memberId was explicitly set'
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

export async function getDetailedFinancialStatement(
  callerId: number,
  month: string
): Promise<DetailedFinancialStatementResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  const { from, to } = monthToRange(month);

  const [incomeAggregates, expenseEntries, totalIncome, totalExpenses, openingBalance] =
    await Promise.all([
      repo.getIncomeAggregatesForRange(from, to),
      repo.getAllExpenseReportRows(from, to),
      repo.sumIncomeForRange(from, to),
      repo.sumExpensesForRange(from, to),
      computeOpeningBalance(from)
    ]);

  const currentBalance = (
    Number.parseFloat(openingBalance) +
    Number.parseFloat(totalIncome) -
    Number.parseFloat(totalExpenses)
  ).toFixed(2);

  const incomePivot = buildIncomePivot(incomeAggregates);

  return {
    period: { from, to },
    openingBalance,
    totalIncome,
    totalExpenses,
    currentBalance,
    incomePivot,
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
