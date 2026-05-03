import * as repo from './repository';
import { findExpenseCategoryById } from '../categories/repository';
import { findPaymentMethodById } from '../../payment-methods/repository';
import { assertPermission } from '../../../../lib/permissions';
import { Module, Action } from '../../../../lib/constants';
import { httpError } from '../../../../lib/errors';
import { paginate } from '../../../../lib/pagination';
import type {
  CreateExpenseEntryRequest,
  UpdateExpenseEntryRequest,
  ExpenseEntryResponse
} from './schema';

async function validateEntry(data: {
  categoryId: number;
  paymentMethodId: number;
  parentId?: number;
}) {
  const category = await findExpenseCategoryById(data.categoryId);
  if (!category) throw httpError(404, 'Expense category not found');

  const paymentMethod = await findPaymentMethodById(data.paymentMethodId);
  if (!paymentMethod) throw httpError(404, 'Payment method not found');

  if (!paymentMethod.allowsOutflow) {
    throw httpError(400, 'Selected payment method does not allow outflow');
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
  await validateEntry({
    categoryId: body.categoryId,
    paymentMethodId: body.paymentMethodId,
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

  const mergedValues = {
    categoryId: body.categoryId ?? entry.categoryId,
    paymentMethodId: body.paymentMethodId ?? entry.paymentMethodId,
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
  await repo.cancelExpenseEntry(targetId);
}
