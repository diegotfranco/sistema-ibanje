import { randomUUID } from 'node:crypto';
import * as repo from './repository.js';
import { findExpenseCategoryById, hasChildrenExpenseCategory } from '../categories/repository.js';
import { findMemberById } from '../../../members/repository.js';
import { findPaymentMethodById } from '../../payment-methods/repository.js';
import { findDesignatedFundById } from '../../designated-funds/repository.js';
import { findMonthlyClosingByPeriod } from '../../monthly-closings/repository.js';
import { assertPermission } from '../../../../lib/permissions.js';
import { Module, Action } from '../../../../lib/constants.js';
import { httpError } from '../../../../lib/errors.js';
import { paginate } from '../../../../lib/pagination.js';
import {
  uploadFile,
  deleteFile,
  getPresignedUrl,
  ALLOWED_MIME_TYPES
} from '../../../../lib/storage.js';
import type {
  CreateExpenseEntryRequest,
  UpdateExpenseEntryRequest,
  ExpenseEntryResponse
} from './schema.js';

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
  paymentMethodId: number;
  designatedFundId?: number;
  memberId?: number;
  parentId?: number;
}) {
  const category = await findExpenseCategoryById(data.categoryId);
  if (!category) throw httpError(404, 'Expense category not found');

  if (await hasChildrenExpenseCategory(data.categoryId)) {
    throw httpError(400, 'Cannot select a parent category; choose a specific sub-category');
  }

  if (data.memberId) {
    const member = await findMemberById(data.memberId);
    if (!member) throw httpError(404, 'Member not found');
  }

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

function buildReceiptKey(referenceDate: string, ext: string): string {
  const year = referenceDate.substring(0, 4);
  const month = referenceDate.substring(5, 7);
  return `receipts/${year}/${month}/${randomUUID()}.${ext}`;
}

type Row = NonNullable<Awaited<ReturnType<typeof repo.findExpenseEntryById>>>;

async function toResponse(row: Row): Promise<ExpenseEntryResponse> {
  const receipt = row.receipt ? await getPresignedUrl(row.receipt) : null;
  return { ...row, receipt } as ExpenseEntryResponse;
}

export async function listExpenseEntries(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.ExpenseEntries, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listExpenseEntries(offset, limit);
  const enriched = await Promise.all(rows.map(toResponse));
  return paginate(enriched, total, page, limit);
}

export async function getExpenseEntryById(id: number): Promise<ExpenseEntryResponse | null> {
  const entry = await repo.findExpenseEntryById(id);
  if (!entry) return null;
  return toResponse(entry);
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
    memberId: body.memberId,
    parentId: body.parentId
  });

  const created = await repo.insertExpenseEntry({ ...body, userId: callerId });
  if (!created) throw new Error('Failed to create expense entry');
  return toResponse(created);
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
    memberId: body.memberId ?? entry.memberId ?? undefined,
    parentId: body.parentId ?? entry.parentId ?? undefined
  };
  await validateEntry(mergedValues);

  const updated = await repo.updateExpenseEntry(
    targetId,
    body as Parameters<typeof repo.updateExpenseEntry>[1]
  );
  if (!updated) return null;
  return toResponse(updated);
}

export async function cancelExpenseEntry(callerId: number, targetId: number): Promise<void | null> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.Delete);
  const entry = await repo.findExpenseEntryById(targetId);
  if (!entry) return null;
  await assertPeriodEditable(entry.referenceDate);
  await repo.cancelExpenseEntry(targetId);
}

export async function uploadExpenseReceipt(
  callerId: number,
  entryId: number,
  buffer: Buffer,
  mimetype: string
): Promise<ExpenseEntryResponse | null> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.Update);
  const entry = await repo.findExpenseEntryById(entryId);
  if (!entry) return null;

  const ext = ALLOWED_MIME_TYPES[mimetype];
  if (!ext) throw httpError(400, 'Unsupported file type. Allowed: JPEG, PNG, PDF');

  if (entry.receipt) await deleteFile(entry.receipt);

  const key = buildReceiptKey(entry.referenceDate, ext);
  await uploadFile(key, buffer, mimetype);
  await repo.updateReceiptKey(entryId, key);

  const updated = await repo.findExpenseEntryById(entryId);
  return toResponse(updated!);
}

export async function deleteExpenseReceipt(
  callerId: number,
  entryId: number
): Promise<'not_found' | 'no_receipt' | 'ok'> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.Update);
  const entry = await repo.findExpenseEntryById(entryId);
  if (!entry) return 'not_found';
  if (!entry.receipt) return 'no_receipt';

  await deleteFile(entry.receipt);
  await repo.updateReceiptKey(entryId, null);
  return 'ok';
}
