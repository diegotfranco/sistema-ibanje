import * as repo from './repository';
import { findIncomeCategoryById } from '../categories/repository';
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
  CreateIncomeEntryRequest,
  UpdateIncomeEntryRequest,
  IncomeEntryResponse
} from './schema';

async function validateEntry(data: {
  categoryId: number;
  memberId?: number;
  paymentMethodId: number;
  designatedFundId?: number;
}) {
  const category = await findIncomeCategoryById(data.categoryId);
  if (!category) throw httpError(404, 'Income category not found');

  if (category.requiresDonor && !data.memberId) {
    throw httpError(400, 'This category requires a donor (memberId)');
  }

  const paymentMethod = await findPaymentMethodById(data.paymentMethodId);
  if (!paymentMethod) throw httpError(404, 'Payment method not found');

  if (!paymentMethod.allowsInflow) {
    throw httpError(400, 'Selected payment method does not allow inflow');
  }

  if (data.designatedFundId) {
    const fund = await findDesignatedFundById(data.designatedFundId);
    if (!fund) throw httpError(404, 'Designated fund not found');
  }
}

export async function listIncomeEntries(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.IncomeEntries, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listIncomeEntries(offset, limit);
  return paginate(
    rows.map((r): IncomeEntryResponse => r as any),
    total,
    page,
    limit
  );
}

export async function getIncomeEntryById(id: number): Promise<IncomeEntryResponse | null> {
  const entry = await repo.findIncomeEntryById(id);
  return entry as any;
}

export async function createIncomeEntry(
  callerId: number,
  body: CreateIncomeEntryRequest
): Promise<IncomeEntryResponse> {
  await assertPermission(callerId, Module.IncomeEntries, Action.Create);
  await assertPeriodEditable(body.referenceDate);
  await validateEntry({
    categoryId: body.categoryId,
    memberId: body.memberId,
    paymentMethodId: body.paymentMethodId,
    designatedFundId: body.designatedFundId
  });
  const created = await repo.insertIncomeEntry({
    ...body,
    userId: callerId
  });
  if (!created) throw new Error('Failed to create income entry');
  return created as any;
}

export async function updateIncomeEntry(
  callerId: number,
  targetId: number,
  body: UpdateIncomeEntryRequest
): Promise<IncomeEntryResponse | null> {
  await assertPermission(callerId, Module.IncomeEntries, Action.Update);
  const entry = await repo.findIncomeEntryById(targetId);
  if (!entry) return null;

  await assertPeriodEditable(body.referenceDate ?? entry.referenceDate);

  const mergedValues = {
    categoryId: body.categoryId ?? entry.categoryId,
    memberId: body.memberId ?? entry.memberId ?? undefined,
    paymentMethodId: body.paymentMethodId ?? entry.paymentMethodId,
    designatedFundId: body.designatedFundId ?? entry.designatedFundId ?? undefined
  };
  await validateEntry(mergedValues);

  const updateData: Record<string, any> = { ...body };
  if (body.amount !== undefined) {
    updateData.amount = body.amount.toString();
  }

  return (await repo.updateIncomeEntry(targetId, updateData)) as any;
}

export async function cancelIncomeEntry(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.IncomeEntries, Action.Delete);
  const entry = await repo.findIncomeEntryById(targetId);
  if (!entry) return null;
  await assertPeriodEditable(entry.referenceDate);
  await repo.cancelIncomeEntry(targetId);
}
