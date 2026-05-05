import * as repo from './repository';
import { assertPermission } from '../../../lib/permissions';
import { Module, Action } from '../../../lib/constants';
import { httpError } from '../../../lib/errors';
import { paginate } from '../../../lib/pagination';
import type {
  CreateMonthlyClosingRequest,
  SubmitMonthlyClosingRequest,
  ApproveMonthlyClosingRequest,
  RejectMonthlyClosingRequest,
  MonthlyClosingResponse
} from './schema';
import type { MonthlyClosing } from '../../../db/schema';

async function buildResponse(
  closing: MonthlyClosing,
  includeReservedFunds = true
): Promise<MonthlyClosingResponse> {
  const [totalIncome, totalExpenses, totalReservedFunds] = await Promise.all([
    repo.sumIncomeForPeriod(closing.periodYear, closing.periodMonth),
    repo.sumExpensesForPeriod(closing.periodYear, closing.periodMonth),
    includeReservedFunds
      ? repo.getTotalReservedFunds(closing.periodYear, closing.periodMonth)
      : Promise.resolve(undefined)
  ]);

  let openingBalance: string;
  let openingBalancePending: boolean;
  let closingBalance: string;

  if (closing.status === 'fechado' && closing.closingBalance !== null) {
    closingBalance = closing.closingBalance;
    openingBalancePending = false;
    openingBalance = (
      parseFloat(closingBalance) -
      parseFloat(totalIncome) +
      parseFloat(totalExpenses)
    ).toFixed(2);
  } else {
    const prevYear = closing.periodMonth === 1 ? closing.periodYear - 1 : closing.periodYear;
    const prevMonth = closing.periodMonth === 1 ? 12 : closing.periodMonth - 1;

    const lastFechado = await repo.findPreviousFechadoClosing(
      closing.periodYear,
      closing.periodMonth
    );

    let baseBal: string;
    let rangeStart: string;
    if (lastFechado) {
      baseBal = lastFechado.closingBalance ?? '0';
      rangeStart = repo.periodEnd(lastFechado.periodYear, lastFechado.periodMonth);
    } else {
      const settings = await repo.findFinanceSettings();
      baseBal = settings?.openingBalance ?? '0';
      rangeStart = '2020-01-01';
    }

    const rangeEnd = repo.periodStart(closing.periodYear, closing.periodMonth);
    const lastFechadoIsPrevMonth =
      lastFechado?.periodYear === prevYear && lastFechado?.periodMonth === prevMonth;

    if (!lastFechadoIsPrevMonth) {
      const intermediateNet = await repo.sumNetForDateRange(rangeStart, rangeEnd);
      openingBalance = (parseFloat(baseBal) + parseFloat(intermediateNet)).toFixed(2);
      openingBalancePending = true;
    } else {
      openingBalance = baseBal;
      openingBalancePending = false;
    }

    closingBalance = (
      parseFloat(openingBalance) +
      parseFloat(totalIncome) -
      parseFloat(totalExpenses)
    ).toFixed(2);
  }

  return {
    id: closing.id,
    periodYear: closing.periodYear,
    periodMonth: closing.periodMonth,
    status: closing.status,
    openingBalance,
    openingBalancePending,
    closingBalance,
    totalIncome,
    totalExpenses,
    treasurerNotes: closing.treasurerNotes,
    accountantNotes: closing.accountantNotes,
    submittedByUserId: closing.submittedByUserId,
    submittedAt: closing.submittedAt,
    reviewedAt: closing.reviewedAt,
    closedByUserId: closing.closedByUserId,
    closedAt: closing.closedAt,
    createdAt: closing.createdAt,
    updatedAt: closing.updatedAt,
    totalReservedFunds
  };
}

export async function listMonthlyClosings(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.MonthlyClosings, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listMonthlyClosings(offset, limit);
  const data = await Promise.all(rows.map((r) => buildResponse(r, false)));
  return paginate(data, total, page, limit);
}

export async function getMonthlyClosingById(id: number): Promise<MonthlyClosingResponse | null> {
  const closing = await repo.findMonthlyClosingById(id);
  if (!closing) return null;
  return buildResponse(closing);
}

export async function createMonthlyClosing(
  callerId: number,
  body: CreateMonthlyClosingRequest
): Promise<MonthlyClosingResponse> {
  await assertPermission(callerId, Module.MonthlyClosings, Action.Create);

  const existing = await repo.findMonthlyClosingByPeriod(body.periodYear, body.periodMonth);
  if (existing) throw httpError(409, 'A closing for this period already exists');

  const created = await repo.insertMonthlyClosing({
    periodYear: body.periodYear,
    periodMonth: body.periodMonth
  });
  if (!created) throw new Error('Failed to create monthly closing');
  return buildResponse(created);
}

export async function submitMonthlyClosing(
  callerId: number,
  id: number,
  body: SubmitMonthlyClosingRequest
): Promise<MonthlyClosingResponse> {
  await assertPermission(callerId, Module.MonthlyClosings, Action.Create);

  const closing = await repo.findMonthlyClosingById(id);
  if (!closing) throw httpError(404, 'Monthly closing not found');
  if (closing.status !== 'aberto') throw httpError(409, 'Only open closings can be submitted');

  const updated = await repo.updateMonthlyClosing(id, {
    status: 'em revisão',
    ...(body.treasurerNotes !== undefined && { treasurerNotes: body.treasurerNotes }),
    submittedByUserId: callerId,
    submittedAt: new Date()
  });
  return buildResponse(updated!);
}

export async function approveMonthlyClosing(
  callerId: number,
  id: number,
  body: ApproveMonthlyClosingRequest
): Promise<MonthlyClosingResponse> {
  await assertPermission(callerId, Module.MonthlyClosings, Action.Review);

  const closing = await repo.findMonthlyClosingById(id);
  if (!closing) throw httpError(404, 'Monthly closing not found');
  if (closing.status !== 'em revisão')
    throw httpError(409, 'Only pending review closings can be approved');

  const updated = await repo.updateMonthlyClosing(id, {
    status: 'aprovado',
    ...(body.accountantNotes !== undefined && { accountantNotes: body.accountantNotes }),
    reviewedAt: new Date()
  });
  return buildResponse(updated!);
}

export async function rejectMonthlyClosing(
  callerId: number,
  id: number,
  body: RejectMonthlyClosingRequest
): Promise<MonthlyClosingResponse> {
  await assertPermission(callerId, Module.MonthlyClosings, Action.Review);

  const closing = await repo.findMonthlyClosingById(id);
  if (!closing) throw httpError(404, 'Monthly closing not found');
  if (closing.status !== 'em revisão')
    throw httpError(409, 'Only pending review closings can be rejected');

  const updated = await repo.updateMonthlyClosing(id, {
    status: 'aberto',
    ...(body.accountantNotes !== undefined && { accountantNotes: body.accountantNotes }),
    reviewedAt: new Date()
  });
  return buildResponse(updated!);
}

export async function closeMonthlyClosing(
  callerId: number,
  id: number
): Promise<MonthlyClosingResponse> {
  await assertPermission(callerId, Module.MonthlyClosings, Action.Update);

  const closing = await repo.findMonthlyClosingById(id);
  if (!closing) throw httpError(404, 'Monthly closing not found');
  if (closing.status !== 'aprovado') throw httpError(409, 'Only approved closings can be closed');

  const prevYear = closing.periodMonth === 1 ? closing.periodYear - 1 : closing.periodYear;
  const prevMonth = closing.periodMonth === 1 ? 12 : closing.periodMonth - 1;
  const prevMonthClosing = await repo.findMonthlyClosingByPeriod(prevYear, prevMonth);
  if (prevMonthClosing && prevMonthClosing.status !== 'fechado') {
    throw httpError(409, 'Previous period must be closed before closing this period');
  }

  const [totalIncome, totalExpenses] = await Promise.all([
    repo.sumIncomeForPeriod(closing.periodYear, closing.periodMonth),
    repo.sumExpensesForPeriod(closing.periodYear, closing.periodMonth)
  ]);

  const prevClosing = await repo.findPreviousFechadoClosing(
    closing.periodYear,
    closing.periodMonth
  );
  let openingBal: string;
  if (prevClosing) {
    openingBal = prevClosing.closingBalance ?? '0';
  } else {
    const settings = await repo.findFinanceSettings();
    openingBal = settings?.openingBalance ?? '0';
  }
  const computedBalance = (
    parseFloat(openingBal) +
    parseFloat(totalIncome) -
    parseFloat(totalExpenses)
  ).toFixed(2);

  const updated = await repo.updateMonthlyClosing(id, {
    status: 'fechado',
    closingBalance: computedBalance,
    closedByUserId: callerId,
    closedAt: new Date()
  });
  return buildResponse(updated!);
}

export async function deleteMonthlyClosing(callerId: number, id: number): Promise<void | null> {
  await assertPermission(callerId, Module.MonthlyClosings, Action.Delete);

  const closing = await repo.findMonthlyClosingById(id);
  if (!closing) return null;
  if (closing.status !== 'aberto') throw httpError(409, 'Only open closings can be deleted');

  await repo.deleteMonthlyClosing(id);
}
