import * as repo from './repository.js';
import { sumExpensesForRange } from '../../reports/repository.js';
import { findIncomeCategoryById, hasChildrenIncomeCategory } from '../categories/repository.js';
import { findPaymentMethodById } from '../../payment-methods/repository.js';
import { findDesignatedFundById } from '../../designated-funds/repository.js';
import { findEventById } from '../../../events/repository.js';
import { assertPermission } from '../../../../lib/permissions.js';
import { assertPeriodEditable, deriveReferenceDateFromDeposit } from '../../../../lib/finance.js';
import { Module, Action } from '../../../../lib/constants.js';
import { httpError } from '../../../../lib/errors.js';
import { paginate } from '../../../../lib/pagination.js';
import type {
  CreateIncomeEntryRequest,
  UpdateIncomeEntryRequest,
  IncomeEntryResponse,
  IncomeSummaryQuery,
  IncomeSummaryResponse
} from './schema.js';

type Row = NonNullable<Awaited<ReturnType<typeof repo.findIncomeEntryById>>>;

function toResponse(row: Row): IncomeEntryResponse {
  return row as unknown as IncomeEntryResponse;
}

async function validateEntry(data: {
  categoryId: number;
  attenderId?: number;
  paymentMethodId: number;
  designatedFundId?: number | null;
  eventId?: number | null;
  referenceDate?: string;
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
  const category = await findIncomeCategoryById(data.categoryId);
  if (!category) throw httpError(404, 'Income category not found');

  if (category.requiresMember && !data.attenderId) {
    throw httpError(400, 'This income category requires a donor (attenderId)');
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

    if (fund.targetDate && data.referenceDate && data.referenceDate > fund.targetDate) {
      const formattedDate = new Date(fund.targetDate).toLocaleDateString('pt-BR');
      throw httpError(400, `O fundo "${fund.name}" encerrou em ${formattedDate}`);
    }
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
  const referenceDate = deriveReferenceDateFromDeposit(body.depositDate);
  await assertPeriodEditable(referenceDate);
  await validateEntry({
    categoryId: body.categoryId,
    attenderId: body.attenderId,
    paymentMethodId: body.paymentMethodId,
    designatedFundId: body.designatedFundId,
    eventId: body.eventId,
    referenceDate
  });
  const created = await repo.insertIncomeEntry({
    ...body,
    referenceDate,
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

  const referenceDate = body.depositDate
    ? deriveReferenceDateFromDeposit(body.depositDate)
    : entry.referenceDate;
  await assertPeriodEditable(referenceDate);

  const mergedValues = {
    categoryId: body.categoryId ?? entry.categoryId,
    attenderId: body.attenderId ?? entry.attenderId ?? undefined,
    paymentMethodId: body.paymentMethodId ?? entry.paymentMethodId,
    designatedFundId:
      body.designatedFundId !== undefined
        ? body.designatedFundId
        : (entry.designatedFundId ?? undefined),
    eventId: body.eventId !== undefined ? body.eventId : (entry.eventId ?? undefined),
    referenceDate
  };
  await validateEntry(mergedValues);

  const updateData: Parameters<typeof repo.updateIncomeEntry>[1] = {
    ...body,
    ...(body.depositDate ? { referenceDate } : {}),
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

export async function summarizeIncome(
  callerId: number,
  query: IncomeSummaryQuery
): Promise<IncomeSummaryResponse> {
  await assertPermission(callerId, Module.IncomeEntries, Action.View);

  const [rows, totalExpense] = await Promise.all([
    repo.summarizeIncomeByTopLevelCategory(query.from, query.to),
    sumExpensesForRange(query.from, query.to)
  ]);

  const total = rows.reduce((sum, row) => sum + Number.parseFloat(row.total), 0).toFixed(2);

  return { rows, total, totalExpense };
}
