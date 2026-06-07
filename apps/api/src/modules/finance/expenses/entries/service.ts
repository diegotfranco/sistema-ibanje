import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import * as repo from './repository.js';
import { sumIncomeForRange } from '../../reports/repository.js';
import { findExpenseCategoryById, hasChildrenExpenseCategory } from '../categories/repository.js';
import { findAttenderById } from '../../../attenders/repository.js';
import { findPaymentMethodById } from '../../payment-methods/repository.js';
import { findDesignatedFundById } from '../../designated-funds/repository.js';
import { findEventById } from '../../../events/repository.js';
import { assertPermission } from '../../../../lib/permissions.js';
import { assertPeriodEditable, assertEntryTransition } from '../../../../lib/finance.js';
import { Module, Action } from '../../../../lib/constants.js';
import { httpError } from '../../../../lib/errors.js';
import { paginate } from '../../../../lib/pagination.js';
import { FundStatus } from '@sistema-ibanje/shared';
import {
  uploadFile,
  deleteFile,
  getFileStream,
  ALLOWED_MIME_TYPES,
  type StoredFile
} from '../../../../lib/storage.js';
import type {
  CreateExpenseEntryRequest,
  UpdateExpenseEntryRequest,
  ExpenseEntryResponse,
  ExpenseSummaryQuery,
  ExpenseSummaryResponse
} from './schema.js';

async function validateEntry(data: {
  categoryId: number;
  paymentMethodId: number;
  designatedFundId?: number | null;
  eventId?: number | null;
  attenderId?: number;
  parentId?: number;
}) {
  if (data.designatedFundId && data.eventId) {
    throw httpError(400, 'Selecione um fundo OU um evento, não ambos.', {
      fieldErrors: { eventId: 'Selecione um fundo OU um evento, não ambos.' }
    });
  }
  if (data.eventId) {
    const evt = await findEventById(data.eventId);
    if (!evt) throw httpError(404, 'Event not found');
  }
  const category = await findExpenseCategoryById(data.categoryId);
  if (!category) throw httpError(404, 'Expense category not found');

  if (await hasChildrenExpenseCategory(data.categoryId)) {
    throw httpError(400, 'Cannot select a parent category; choose a specific sub-category');
  }

  if (data.attenderId) {
    const attender = await findAttenderById(data.attenderId);
    if (!attender) throw httpError(404, 'Attender not found');
  }

  const paymentMethod = await findPaymentMethodById(data.paymentMethodId);
  if (!paymentMethod) throw httpError(404, 'Payment method not found');

  if (!paymentMethod.allowsOutflow) {
    throw httpError(400, 'Selected payment method does not allow outflow');
  }

  if (data.designatedFundId) {
    const fund = await findDesignatedFundById(data.designatedFundId);
    if (!fund) throw httpError(404, 'Designated fund not found');

    if (fund.status === FundStatus.Ended) {
      throw httpError(400, `A campanha "${fund.name}" está encerrada.`, {
        fieldErrors: { designatedFundId: 'Campanha encerrada.' }
      });
    }
  }

  if (data.parentId) {
    const parent = await repo.findExpenseEntryById(data.parentId);
    if (!parent) throw httpError(404, 'Parent expense entry not found');
  }
}

function buildReceiptKey(date: string, ext: string): string {
  const year = date.substring(0, 4);
  const month = date.substring(5, 7);
  return `receipts/${year}/${month}/${randomUUID()}.${ext}`;
}

type Row = NonNullable<Awaited<ReturnType<typeof repo.findExpenseEntryById>>>;

function toResponse(row: Row): ExpenseEntryResponse {
  const { receipt, ...rest } = row;
  return { ...rest, hasReceipt: receipt !== null } as ExpenseEntryResponse;
}

export async function listExpenseEntries(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.ExpenseEntries, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listExpenseEntries(offset, limit);
  return paginate(rows.map(toResponse), total, page, limit);
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
  await assertPeriodEditable(body.date);
  await validateEntry({
    categoryId: body.categoryId,
    paymentMethodId: body.paymentMethodId,
    designatedFundId: body.designatedFundId,
    eventId: body.eventId,
    attenderId: body.attenderId,
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

  await assertPeriodEditable(body.date ?? entry.date);

  if (body.status !== undefined) assertEntryTransition(entry.status, body.status);

  const mergedValues = {
    categoryId: body.categoryId ?? entry.categoryId,
    paymentMethodId: body.paymentMethodId ?? entry.paymentMethodId,
    designatedFundId:
      body.designatedFundId !== undefined
        ? body.designatedFundId
        : (entry.designatedFundId ?? undefined),
    eventId: body.eventId !== undefined ? body.eventId : (entry.eventId ?? undefined),
    attenderId: body.attenderId ?? entry.attenderId ?? undefined,
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
  await assertPeriodEditable(entry.date);
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

  const sniffed = await fileTypeFromBuffer(buffer);
  if (sniffed?.mime !== mimetype) {
    throw httpError(400, 'File contents do not match the declared type');
  }

  if (entry.receipt) await deleteFile(entry.receipt);

  const key = buildReceiptKey(entry.date, ext);
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

export async function getExpenseReceiptFile(
  callerId: number,
  entryId: number
): Promise<StoredFile | null> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.View);
  const entry = await repo.findExpenseEntryById(entryId);
  if (!entry || !entry.receipt) return null;
  return getFileStream(entry.receipt);
}

export async function summarizeExpenses(
  callerId: number,
  query: ExpenseSummaryQuery
): Promise<ExpenseSummaryResponse> {
  await assertPermission(callerId, Module.ExpenseEntries, Action.View);

  const [rows, totalIncome] = await Promise.all([
    repo.summarizeExpensesByTopLevelCategory(query.from, query.to),
    sumIncomeForRange(query.from, query.to)
  ]);

  const total = rows.reduce((sum, row) => sum + Number.parseFloat(row.total), 0).toFixed(2);

  return { rows, total, totalIncome };
}
