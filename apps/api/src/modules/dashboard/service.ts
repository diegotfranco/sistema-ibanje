import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import type { DashboardResponse } from './schema.js';
import * as financeRepo from '../finance/reports/repository.js';
import * as financeService from '../finance/reports/service.js';
import * as monthlyClosingsRepo from '../finance/monthly-closings/repository.js';

function monthToRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
  const to = isCurrentMonth
    ? today.toISOString().slice(0, 10)
    : `${month}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function getPreviousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) {
    return `${y - 1}-12`;
  }
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function calculateDeltaPct(current: string, previous: string): string {
  const curr = Number.parseFloat(current);
  const prev = Number.parseFloat(previous);
  if (prev === 0) return curr === 0 ? '0.00' : '100.00';
  return (((curr - prev) / Math.abs(prev)) * 100).toFixed(2);
}

function buildFundSummary(
  fundId: number,
  fundName: string,
  targetAmount: string | null,
  raised: string,
  expenses: string
) {
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

async function getLast6MonthsAverage(month: string, categoryNames: string[]): Promise<string> {
  // Average participation % over the 6 months prior to the selected month (not including it)
  const months: string[] = [];
  let current = getPreviousMonth(month);
  for (let i = 0; i < 6; i++) {
    months.push(current);
    current = getPreviousMonth(current);
  }

  let totalPct = 0;
  for (const m of months) {
    const { from, to } = monthToRange(m);
    const categoryIds = await financeRepo.findIncomeCategoryIdsByNames(categoryNames);
    const totalActiveAttenders = await financeRepo.countActiveAttenders();
    const contributors = await financeRepo.countDistinctAttendersWithOfferings(
      from,
      to,
      categoryIds
    );
    const pct = totalActiveAttenders > 0 ? (contributors / totalActiveAttenders) * 100 : 0;
    totalPct += pct;
  }

  return (totalPct / months.length).toFixed(2);
}

async function getRecentEvents(month: string): Promise<
  Array<{
    eventId: number;
    eventTitle: string;
    startTime: string;
    endTime: string;
    totalSpent: string;
    totalRaised: string;
    net: string;
  }>
> {
  // Get events with endTime within 90 days ending at the last day of the selected month
  const [y, m] = month.split('-').map(Number);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
  const windowEnd = isCurrentMonth ? today : new Date(y, m, 0, 23, 59, 59);
  const windowStart = new Date(windowEnd.getTime() - 90 * 24 * 60 * 60 * 1000);

  const allEvents = await financeRepo.findAllActiveEvents();
  const income = await financeRepo.sumAllTimeIncomePerEvent();
  const expenses = await financeRepo.sumAllTimeExpensesPerEvent();

  const filtered = allEvents
    .filter((e) => {
      const endTime = new Date(e.endTime);
      return endTime >= windowStart && endTime <= windowEnd;
    })
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

  return filtered.map((e) => {
    const raised = income.get(e.id) ?? '0.00';
    const spent = expenses.get(e.id) ?? '0.00';
    const net = (Number.parseFloat(raised) - Number.parseFloat(spent)).toFixed(2);
    return {
      eventId: e.id,
      eventTitle: e.title,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      totalSpent: spent,
      totalRaised: raised,
      net
    };
  });
}

export async function getDashboard(callerId: number, month: string): Promise<DashboardResponse> {
  await assertPermission(callerId, Module.Dashboard, Action.View);

  const currentRange = monthToRange(month);
  const previousMonth = getPreviousMonth(month);
  const previousRange = monthToRange(previousMonth);

  // Finance KPIs: current and previous month
  const [
    currentIncome,
    previousIncome,
    currentExpenses,
    previousExpenses,
    pendingIncomeCount,
    pendingExpensesCount,
    openingBalance
  ] = await Promise.all([
    financeRepo.sumIncomeForRange(currentRange.from, currentRange.to),
    financeRepo.sumIncomeForRange(previousRange.from, previousRange.to),
    financeRepo.sumExpensesForRange(currentRange.from, currentRange.to),
    financeRepo.sumExpensesForRange(previousRange.from, previousRange.to),
    financeRepo.countIncomeReportRows(currentRange.from, currentRange.to, 'pendente'),
    financeRepo.countExpenseReportRows(currentRange.from, currentRange.to, 'pendente'),
    financeService.computeOpeningBalance(currentRange.from)
  ]);

  const currentNetResult = (
    Number.parseFloat(currentIncome) - Number.parseFloat(currentExpenses)
  ).toFixed(2);
  const previousNetResult = (
    Number.parseFloat(previousIncome) - Number.parseFloat(previousExpenses)
  ).toFixed(2);

  // Cash balance: opening + income paid - expenses paid
  const currentBalance = financeService.computeCurrentBalance(
    openingBalance,
    currentIncome,
    currentExpenses
  );

  const finance = {
    income: {
      current: currentIncome,
      previous: previousIncome,
      deltaPct: calculateDeltaPct(currentIncome, previousIncome)
    },
    expenses: {
      current: currentExpenses,
      previous: previousExpenses,
      deltaPct: calculateDeltaPct(currentExpenses, previousExpenses)
    },
    netResult: {
      current: currentNetResult,
      previous: previousNetResult,
      deltaPct: calculateDeltaPct(currentNetResult, previousNetResult)
    },
    cashBalance: {
      current: currentBalance,
      asOf: currentRange.to
    },
    pendingCounts: {
      income: pendingIncomeCount,
      expenses: pendingExpensesCount
    }
  };

  // Participation metrics
  const [titheIds, offeringIds] = await Promise.all([
    financeRepo.findIncomeCategoryIdsByNames(['Dízimo']),
    financeRepo.findIncomeCategoryIdsByNames(['Oferta', 'Doação'])
  ]);

  const [totalActiveAttenders, currentTithePayers, currentOfferingPayers] = await Promise.all([
    financeRepo.countActiveAttenders(),
    financeRepo.countDistinctAttendersWithTithe(currentRange.from, currentRange.to, titheIds),
    financeRepo.countDistinctAttendersWithOfferings(currentRange.from, currentRange.to, offeringIds)
  ]);

  const currentTithePct =
    totalActiveAttenders > 0
      ? ((currentTithePayers / totalActiveAttenders) * 100).toFixed(2)
      : '0.00';
  const currentOfferingPct =
    totalActiveAttenders > 0
      ? ((currentOfferingPayers / totalActiveAttenders) * 100).toFixed(2)
      : '0.00';

  const sixMonthTitheAvg = await getLast6MonthsAverage(month, ['Dízimo']);
  const sixMonthOfferingAvg = await getLast6MonthsAverage(month, ['Oferta', 'Doação']);

  const participation = {
    tithe: {
      currentPct: currentTithePct,
      sixMonthAvgPct: sixMonthTitheAvg,
      deltaPct: calculateDeltaPct(currentTithePct, sixMonthTitheAvg)
    },
    offering: {
      currentPct: currentOfferingPct,
      sixMonthAvgPct: sixMonthOfferingAvg,
      deltaPct: calculateDeltaPct(currentOfferingPct, sixMonthOfferingAvg)
    }
  };

  // 12-month trends
  // Category name contract: Dízimo, Oferta, Doação must match the names in seed-data.ts
  const monthlyTrends = [];
  let trendMonth = month;
  for (let i = 0; i < 12; i++) {
    const { from, to } = monthToRange(trendMonth);
    const [income, expenses, categoryBreakdown, titheCount, offeringCount, donationCount] =
      await Promise.all([
        financeRepo.sumIncomeForRange(from, to),
        financeRepo.sumExpensesForRange(from, to),
        financeRepo.getIncomeByCategoryForRange(from, to),
        financeRepo.countIncomeByCategories(from, to, ['Dízimo']),
        financeRepo.countIncomeByCategories(from, to, ['Oferta', 'Doação']),
        financeRepo.countIncomeByCategories(from, to, ['Doação'])
      ]);

    let titheAmount = '0.00';
    let offeringAmount = '0.00';
    let donationAmount = '0.00';
    for (const cat of categoryBreakdown) {
      if (cat.categoryName === 'Dízimo') {
        titheAmount = cat.total;
      } else if (cat.categoryName === 'Oferta') {
        offeringAmount = (Number.parseFloat(offeringAmount) + Number.parseFloat(cat.total)).toFixed(
          2
        );
      } else if (cat.categoryName === 'Doação') {
        donationAmount = cat.total;
      }
    }

    monthlyTrends.unshift({
      month: trendMonth,
      income,
      expenses,
      titheAmount,
      offeringAmount,
      donationAmount,
      titheCount,
      offeringCount,
      donationCount
    });

    trendMonth = getPreviousMonth(trendMonth);
  }

  const trends = { monthly: monthlyTrends };

  // Closing status
  const [y, m] = month.split('-').map(Number);
  const currentClosing = await monthlyClosingsRepo.findMonthlyClosingByPeriod(y, m);

  let priorPendingCount = 0;
  let oldestPendingId: number | null = null;
  if (currentClosing) {
    const priorClosings = await monthlyClosingsRepo.listMonthlyClosings(0, 1000, y);
    const pending = priorClosings.rows.filter((c) => {
      const isPrior =
        c.periodYear < y || (c.periodYear === y && c.periodMonth < m && c.status !== 'fechado');
      return isPrior;
    });
    priorPendingCount = pending.length;
    if (pending.length > 0) {
      oldestPendingId = pending[pending.length - 1]?.id ?? null;
    }
  }

  const closing = {
    currentMonthId: currentClosing?.id ?? null,
    status: currentClosing?.status ?? null,
    runningBalance: currentBalance,
    closingBalance: currentClosing?.closingBalance ?? null,
    priorPendingCount,
    oldestPendingId
  };

  // Funds (active only)
  const [funds, incomePerFund, expensesPerFund] = await Promise.all([
    financeRepo.findAllActiveFunds(),
    financeRepo.sumIncomePerFundForRange(currentRange.from, currentRange.to),
    financeRepo.sumExpensesPerFundForRange(currentRange.from, currentRange.to)
  ]);

  const fundSummaries = funds.map((f) => {
    const raised = incomePerFund.get(f.id) ?? '0.00';
    const expensesVal = expensesPerFund.get(f.id) ?? '0.00';
    return buildFundSummary(f.id, f.name, f.targetAmount ?? null, raised, expensesVal);
  });

  // Events (last 90 days relative to the selected month)
  const recentEvents = await getRecentEvents(month);
  const eventsSummary = {
    count: recentEvents.length,
    totalRaised: recentEvents
      .reduce((sum, e) => sum + Number.parseFloat(e.totalRaised), 0)
      .toFixed(2),
    totalSpent: recentEvents
      .reduce((sum, e) => sum + Number.parseFloat(e.totalSpent), 0)
      .toFixed(2),
    totalNet: recentEvents.reduce((sum, e) => sum + Number.parseFloat(e.net), 0).toFixed(2)
  };

  const events = {
    recent: recentEvents,
    summary: eventsSummary
  };

  return {
    month,
    finance,
    participation,
    trends,
    closing,
    funds: fundSummaries,
    events
  };
}
