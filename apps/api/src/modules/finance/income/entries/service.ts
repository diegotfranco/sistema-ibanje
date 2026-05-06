import * as repo from './repository.js';
import { findIncomeCategoryById, hasChildrenIncomeCategory } from '../categories/repository.js';
import { findPaymentMethodById } from '../../payment-methods/repository.js';
import { findDesignatedFundById } from '../../designated-funds/repository.js';
import { findMonthlyClosingByPeriod } from '../../monthly-closings/repository.js';
import { assertPermission } from '../../../../lib/permissions.js';
import { Module, Action } from '../../../../lib/constants.js';
import { httpError } from '../../../../lib/errors.js';
import { paginate } from '../../../../lib/pagination.js';
import type {
  CreateIncomeEntryRequest,
  UpdateIncomeEntryRequest,
  IncomeEntryResponse
} from './schema.js';

type Row = NonNullable<Awaited<ReturnType<typeof repo.findIncomeEntryById>>>;

function toResponse(row: Row): IncomeEntryResponse {
  return row as unknown as IncomeEntryResponse;
}

async function assertPeriodEditable(referenceDate: string): Promise<void> {
  const year = parseInt(referenceDate.substring(0, 4));
  const month = parseInt(referenceDate.substring(5, 7));

  const closing = await findMonthlyClosingByPeriod(year, month);
  if (closing && closing.status !== 'aberto') {
    throw httpError(409, 'This period is locked for editing');
  }
}

async function validateEntry(data: {
  categoryId: number;
  memberId?: number;
  paymentMethodId: number;
  designatedFundId?: number;
}) {
  const category = await findIncomeCategoryById(data.categoryId);
  if (!category) throw httpError(404, 'Income category not found');

  if (category.requiresMember && !data.memberId) {
    throw httpError(400, 'This income category requires a donor (memberId)');
  }

  if (await hasChildrenIncomeCategory(data.categoryId)) {
    throw httpError(400, 'Cannot select a parent category; choose a specific sub-category');
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
  return paginate(rows.map(toResponse), total, page, limit);
}

export async function getIncomeEntryById(id: number): Promise<IncomeEntryResponse | null> {
  const entry = await repo.findIncomeEntryById(id);
  if (!entry) return null;
  return toResponse(entry);
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
  return toResponse(created);
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

  const updateData: Parameters<typeof repo.updateIncomeEntry>[1] = {
    ...body,
    amount: body.amount !== undefined ? body.amount.toString() : undefined
  };

  const updated = await repo.updateIncomeEntry(targetId, updateData);
  if (!updated) return null;
  return toResponse(updated);
}

export async function cancelIncomeEntry(callerId: number, targetId: number): Promise<void | null> {
  await assertPermission(callerId, Module.IncomeEntries, Action.Delete);
  const entry = await repo.findIncomeEntryById(targetId);
  if (!entry) return null;
  await assertPeriodEditable(entry.referenceDate);
  await repo.cancelIncomeEntry(targetId);
}
