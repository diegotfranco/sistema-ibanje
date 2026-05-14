import fs from 'node:fs';
import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import * as repo from '../modules/finance/reports/repository.js';
import {
  findPreviousFechadoClosing,
  sumNetForDateRange,
  findFinanceSettings,
  periodEnd
} from '../modules/finance/monthly-closings/repository.js';
import {
  DetailedFinancialStatementPdf,
  FinancialStatementPdf
} from '../modules/finance/reports/pdf-template.js';
import type {
  DetailedFinancialStatementResponse,
  FinancialStatementResponse,
  IncomeAggregateRow,
  IncomePivot,
  IncomePivotColumn,
  IncomePivotRow
} from '../modules/finance/reports/schema.js';

const from = '2025-10-01';
const to = '2025-10-31';

const args = process.argv.slice(2);
const modeIdx = args.indexOf('--mode');
const mode: 'detailed' | 'simplified' =
  modeIdx !== -1 && args[modeIdx + 1] === 'simplified' ? 'simplified' : 'detailed';

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
    row.cells[key] = (
      Number.parseFloat(row.cells[key] ?? '0') + Number.parseFloat(agg.total)
    ).toFixed(2);
    row.total = (Number.parseFloat(row.total) + Number.parseFloat(agg.total)).toFixed(2);
  }
  const rows = [...rowMap.values()].sort((a, b) => a.referenceDate.localeCompare(b.referenceDate));
  const grandTotal = rows.reduce((s, r) => s + Number.parseFloat(r.total), 0).toFixed(2);
  return { columns, rows, grandTotal };
}

async function generateDetailed() {
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

  const data: DetailedFinancialStatementResponse = {
    period: { from, to },
    openingBalance,
    totalIncome,
    totalExpenses,
    currentBalance,
    incomePivot: buildIncomePivot(incomeAggregates),
    expenseEntries
  };

  const buf = await renderToBuffer(
    React.createElement(DetailedFinancialStatementPdf, {
      data
    }) as React.ReactElement<DocumentProps>
  );

  fs.writeFileSync('demonstrativo-detalhado.pdf', buf);
  console.log('PDF written to demonstrativo-detalhado.pdf');
}

async function generateSimplified() {
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

  const data: FinancialStatementResponse = {
    period: { from, to },
    openingBalance,
    totalIncome,
    totalExpenses,
    currentBalance,
    incomeByCategory,
    incomeByFund,
    expensesByCategory
  };

  const buf = await renderToBuffer(
    React.createElement(FinancialStatementPdf, { data }) as React.ReactElement<DocumentProps>
  );

  fs.writeFileSync('demonstrativo-simples.pdf', buf);
  console.log('PDF written to demonstrativo-simples.pdf');
}

try {
  if (mode === 'simplified') {
    await generateSimplified();
  } else {
    await generateDetailed();
  }
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
