import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import * as repo from './repository';
import {
  findPreviousFechadoClosing,
  sumNetForDateRange,
  findFinanceSettings,
  periodEnd
} from '../monthly-closings/repository';
import { assertPermission } from '../../../lib/permissions';
import { Module, Action } from '../../../lib/constants';
import { httpError } from '../../../lib/errors';
import { FinancialStatementPdf, DetailedFinancialStatementPdf } from './pdf-template';
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
} from './schema';

function validateDateRange(from: string, to: string) {
  if (from > to) throw httpError(400, "'from' must be on or before 'to'");
}

function buildFundSummary(
  fundId: number,
  fundName: string,
  targetAmount: string | null,
  raised: string,
  expenses: string
): FundSummary {
  const balance = (parseFloat(raised) - parseFloat(expenses)).toFixed(2);
  const progressPercentage =
    targetAmount !== null && parseFloat(targetAmount) > 0
      ? ((parseFloat(balance) / parseFloat(targetAmount)) * 100).toFixed(2)
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
    col.total = (parseFloat(col.total) + parseFloat(agg.total)).toFixed(2);
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
    row.cells[key] = (parseFloat(row.cells[key] ?? '0') + parseFloat(agg.total)).toFixed(2);
    row.total = (parseFloat(row.total) + parseFloat(agg.total)).toFixed(2);
  }

  const rows = [...rowMap.values()].sort((a, b) => a.referenceDate.localeCompare(b.referenceDate));
  const grandTotal = rows.reduce((s, r) => s + parseFloat(r.total), 0).toFixed(2);

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
    return (parseFloat(baseBal) + parseFloat(intermediateNet)).toFixed(2);
  }

  return baseBal;
}

export async function getIncomeReport(
  callerId: number,
  from: string,
  to: string,
  page: number,
  limit: number
): Promise<IncomeReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  validateDateRange(from, to);

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
  from: string,
  to: string,
  page: number,
  limit: number
): Promise<ExpenseReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  validateDateRange(from, to);

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
  from: string,
  to: string
): Promise<FinancialStatementResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  validateDateRange(from, to);

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
    parseFloat(openingBalance) +
    parseFloat(totalIncome) -
    parseFloat(totalExpenses)
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

export async function getMembersReport(callerId: number): Promise<MembersReportResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const toDate = today.toISOString().slice(0, 10);
  const fromDate = sixMonthsAgo.toISOString().slice(0, 10);

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

export async function getFundList(callerId: number): Promise<FundListResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  const [funds, incomeMap, expensesMap] = await Promise.all([
    repo.findAllActiveFunds(),
    repo.sumAllTimeIncomePerFund(),
    repo.sumAllTimeExpensesPerFund()
  ]);

  return {
    funds: funds.map((f) => {
      const raised = incomeMap.get(f.id) ?? '0.00';
      const expenses = expensesMap.get(f.id) ?? '0.00';
      return buildFundSummary(f.id, f.name, f.targetAmount ?? null, raised, expenses);
    })
  };
}

export async function getFundDetail(callerId: number, id: number): Promise<FundDetailResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);

  const fund = await repo.findFundById(id);
  if (!fund) throw httpError(404, 'Fund not found');

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

  return { ...summary, incomeEntries, expenseEntries };
}

export async function renderFinancialStatementPdf(
  callerId: number,
  from: string,
  to: string
): Promise<Buffer> {
  const data = await getFinancialStatement(callerId, from, to);
  return renderToBuffer(
    React.createElement(FinancialStatementPdf, { data }) as React.ReactElement<DocumentProps>
  );
}

export async function getDetailedFinancialStatement(
  callerId: number,
  from: string,
  to: string
): Promise<DetailedFinancialStatementResponse> {
  await assertPermission(callerId, Module.Reports, Action.Report);
  validateDateRange(from, to);

  const [incomeAggregates, expenseEntries, totalIncome, totalExpenses, openingBalance] =
    await Promise.all([
      repo.getIncomeAggregatesForRange(from, to),
      repo.getAllExpenseReportRows(from, to),
      repo.sumIncomeForRange(from, to),
      repo.sumExpensesForRange(from, to),
      computeOpeningBalance(from)
    ]);

  const currentBalance = (
    parseFloat(openingBalance) +
    parseFloat(totalIncome) -
    parseFloat(totalExpenses)
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
  from: string,
  to: string
): Promise<Buffer> {
  const data = await getDetailedFinancialStatement(callerId, from, to);
  return renderToBuffer(
    React.createElement(DetailedFinancialStatementPdf, {
      data
    }) as React.ReactElement<DocumentProps>
  );
}
