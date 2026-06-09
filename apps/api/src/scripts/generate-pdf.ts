import fs from 'node:fs';
import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import * as repo from '../modules/finance/reports/repository.js';
import {
  computeOpeningBalance,
  computeCurrentBalance,
  buildIncomePivot
} from '../modules/finance/reports/service.js';
import {
  DetailedFinancialStatementPdf,
  FinancialStatementPdf
} from '../modules/finance/reports/pdf-template.js';
import { getChurchSettings } from '../modules/church-settings/repository.js';
import { toChurchPdfData, loadChurchLogo } from '../lib/pdf/church.js';
import type {
  DetailedFinancialStatementResponse,
  FinancialStatementResponse
} from '../modules/finance/reports/schema.js';

const from = '2025-10-01';
const to = '2025-10-31';

async function loadChurch() {
  const settings = await getChurchSettings();
  if (!settings) throw new Error('Church settings not initialized — run the seed first.');
  return { church: toChurchPdfData(settings), logo: await loadChurchLogo(settings.logoPath) };
}

const args = process.argv.slice(2);
const modeIdx = args.indexOf('--mode');
const mode: 'detailed' | 'simplified' =
  modeIdx !== -1 && args[modeIdx + 1] === 'simplified' ? 'simplified' : 'detailed';

async function generateDetailed() {
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

  const data: DetailedFinancialStatementResponse = {
    period: { from, to },
    openingBalance,
    totalIncome,
    totalExpenses,
    currentBalance,
    incomePivot,
    incomeEntries,
    expenseEntries
  };

  const { church, logo } = await loadChurch();
  const buf = await renderToBuffer(
    React.createElement(DetailedFinancialStatementPdf, {
      data,
      church,
      logo
    }) as React.ReactElement<DocumentProps>
  );

  fs.writeFileSync('demonstrativo-detalhado.pdf', buf);
  console.log('PDF written to demonstrativo-detalhado.pdf');
}

async function generateSimplified() {
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

  const data: FinancialStatementResponse = {
    period: { from, to },
    openingBalance,
    totalIncome,
    totalExpenses,
    currentBalance,
    incomeByCategory,
    incomeByCampaign,
    expensesByCategory
  };

  const { church, logo } = await loadChurch();
  const buf = await renderToBuffer(
    React.createElement(FinancialStatementPdf, {
      data,
      church,
      logo
    }) as React.ReactElement<DocumentProps>
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
