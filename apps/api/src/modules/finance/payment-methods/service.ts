import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { Module, Action } from '../../../lib/constants.js';
import { httpError } from '../../../lib/errors.js';
import { paginate } from '../../../lib/pagination.js';
import type {
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethodResponse
} from './schema.js';

export async function listPaymentMethods(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.PaymentMethods, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listPaymentMethods(offset, limit);
  return paginate(
    rows.map((r): PaymentMethodResponse => r),
    total,
    page,
    limit
  );
}

export async function getPaymentMethodById(id: number): Promise<PaymentMethodResponse | null> {
  return repo.findPaymentMethodById(id);
}

export async function createPaymentMethod(
  callerId: number,
  body: CreatePaymentMethodRequest
): Promise<PaymentMethodResponse> {
  await assertPermission(callerId, Module.PaymentMethods, Action.Create);
  const created = await repo.insertPaymentMethod(body);
  if (!created) throw new Error('Failed to create payment method');
  return created;
}

export async function updatePaymentMethod(
  callerId: number,
  targetId: number,
  body: UpdatePaymentMethodRequest
): Promise<PaymentMethodResponse | null> {
  await assertPermission(callerId, Module.PaymentMethods, Action.Update);

  const current = await repo.findPaymentMethodById(targetId);
  if (!current) return null;

  const merged = {
    allowsInflow: body.allowsInflow ?? current.allowsInflow,
    allowsOutflow: body.allowsOutflow ?? current.allowsOutflow
  };
  if (!merged.allowsInflow && !merged.allowsOutflow) {
    throw httpError(400, 'At least one of allowsInflow or allowsOutflow must be true');
  }

  return repo.updatePaymentMethod(targetId, body);
}

export async function deactivatePaymentMethod(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.PaymentMethods, Action.Delete);
  const pm = await repo.findPaymentMethodById(targetId);
  if (!pm) return null;
  await repo.deactivatePaymentMethod(targetId);
}
