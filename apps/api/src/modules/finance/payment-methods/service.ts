import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { Module, Action } from '../../../lib/constants.js';
import { httpError, isUniqueViolation } from '../../../lib/errors.js';
import { paginate } from '../../../lib/pagination.js';
import type { DeletedFilter } from '../../../lib/softDelete.js';
import type {
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethodResponse
} from './schema.js';

export async function listPaymentMethods(
  callerId: number,
  page: number,
  limit: number,
  deleted?: DeletedFilter
) {
  await assertPermission(callerId, Module.PaymentMethods, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listPaymentMethods(offset, limit, deleted);
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

export async function softDeletePaymentMethod(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.PaymentMethods, Action.Delete);
  const pm = await repo.findPaymentMethodById(targetId);
  if (!pm) return null;
  await repo.softDeletePaymentMethod(targetId);
}

export async function restorePaymentMethod(
  callerId: number,
  targetId: number
): Promise<PaymentMethodResponse | null> {
  await assertPermission(callerId, Module.PaymentMethods, Action.Delete);
  try {
    return await repo.restorePaymentMethod(targetId);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(
        409,
        'Já existe um registro ativo com este nome. Renomeie o registro antes de restaurá-lo.',
        {
          fieldErrors: { name: 'Nome já em uso por um registro ativo.' }
        }
      );
    }
    throw err;
  }
}
