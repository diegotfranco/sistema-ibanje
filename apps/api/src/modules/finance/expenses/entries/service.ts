import * as repo from './repository';
import { findExpenseCategoryById } from '../categories/repository';
import { findPaymentMethodById } from '../../payment-methods/repository';
import { findDesignatedFundById } from '../../designated-funds/repository';
import { findMonthlyClosingByPeriod } from '../../monthly-closings/repository';
import { assertPermission } from '../../../../lib/permissions';
import { Module, Action } from '../../../../lib/constants';
import { httpError } from '../../../../lib/errors';
import { paginate } from '../../../../lib/pagination';

async function assertPeriodEditable(referenceDate: string): Promise<void> {
  const year = parseInt(referenceDate.substring(0, 4));
  const month = parseInt(referenceDate.substring(5, 7));

  const closing = await findMonthlyClosingByPeriod(year, month);
  if (closing && closing.status !== 'aberto') {
    throw httpError(409, 'This period is locked for editing');
  }

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevClosing = await findMonthlyClosingByPeriod(prevYear, prevMonth);
  if (prevClosing && prevClosing.status !== 'fechado') {
    throw httpError(409, 'Previous period must be fechado before editing entries for this period');
  }
}
import type {
  CreateExpenseEntryRequest,
  UpdateExpenseEntryRequest,
  ExpenseEntryResponse
} from './schema';

async function validateEntry(data: {
  categoryId: number;
  paymentMethodId: number;
  designatedFundId?: number;
  parentId?: number;
}) {
  const category = await findExpenseCategoryById(data.categoryId);
  if (!category) throw httpError(404, 'Expense category not found');

  const paymentMethod = await findPaymentMethodById(data.paymentMethodId);
  if (!paymentMethod) throw httpError(404, 'Payment method not found');

  if (!paymentMethod.allowsOutflow) {
    throw httpError(400, 'Selected payment method does not allow outflow');
  }

  if (data.designatedFundId) {
    const fund = await findDesignatedFundById(data.designatedFundId);
    if (!fund) throw httpError(404, 'Designated fund not found');
  }

  if (data.parentId) {
    const parent = await repo.findExpenseEntryById(data.parentId);
    if (!parent) throw httpError(404, 'Parent expense entry not found');
  }
}

export async function listExpenseEntries(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.ExpenseEntries, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listExpenseEntries(offset, limit);
  return paginate(
    rows.map((r): ExpenseEntryResponse => r as any),
    total,
    page,
    limit
  );
}

export async function getExpenseEntryById(id: number): Promise<ExpenseEntryResponse | null> {
  const entry = await repo.findExpenseEntryById(id);
  return entry as any;
}

export async function createExpenseEntry(
  callerId: number,
  body: CreateExpenseEntryRequest
): Promise<ExpenseEntryResponse> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.Create);
  await assertPeriodEditable(body.referenceDate);
  await validateEntry({
    categoryId: body.categoryId,
    paymentMethodId: body.paymentMethodId,
    designatedFundId: body.designatedFundId,
    parentId: body.parentId
  });
  const created = await repo.insertExpenseEntry({
    ...body,
    userId: callerId
  });
  if (!created) throw new Error('Failed to create expense entry');
  return created as any;
}

export async function updateExpenseEntry(
  callerId: number,
  targetId: number,
  body: UpdateExpenseEntryRequest
): Promise<ExpenseEntryResponse | null> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.Update);
  const entry = await repo.findExpenseEntryById(targetId);
  if (!entry) return null;

  await assertPeriodEditable(body.referenceDate ?? entry.referenceDate);

  const mergedValues = {
    categoryId: body.categoryId ?? entry.categoryId,
    paymentMethodId: body.paymentMethodId ?? entry.paymentMethodId,
    designatedFundId: body.designatedFundId ?? entry.designatedFundId ?? undefined,
    parentId: body.parentId ?? entry.parentId ?? undefined
  };
  await validateEntry(mergedValues);

  return (await repo.updateExpenseEntry(targetId, body as any)) as any;
}

export async function cancelExpenseEntry(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.Delete);
  const entry = await repo.findExpenseEntryById(targetId);
  if (!entry) return null;
  await assertPeriodEditable(entry.referenceDate);
  await repo.cancelExpenseEntry(targetId);
}
