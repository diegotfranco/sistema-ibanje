import * as repo from './repository';
import { assertPermission } from '../../../lib/permissions';
import { Module, Action } from '../../../lib/constants';
import { paginate } from '../../../lib/pagination';
import type {
  CreateDesignatedFundRequest,
  UpdateDesignatedFundRequest,
  DesignatedFundResponse
} from './schema';

export async function listDesignatedFunds(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.DesignatedFunds, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listDesignatedFunds(offset, limit);
  return paginate(
    rows.map((r): DesignatedFundResponse => r),
    total,
    page,
    limit
  );
}

export async function getDesignatedFundById(id: number): Promise<DesignatedFundResponse | null> {
  return repo.findDesignatedFundById(id);
}

export async function createDesignatedFund(
  callerId: number,
  body: CreateDesignatedFundRequest
): Promise<DesignatedFundResponse> {
  await assertPermission(callerId, Module.DesignatedFunds, Action.Create);
  const created = await repo.insertDesignatedFund(body);
  if (!created) throw new Error('Failed to create designated fund');
  return created;
}

export async function updateDesignatedFund(
  callerId: number,
  targetId: number,
  body: UpdateDesignatedFundRequest
): Promise<DesignatedFundResponse | null> {
  await assertPermission(callerId, Module.DesignatedFunds, Action.Update);
  const fund = await repo.findDesignatedFundById(targetId);
  if (!fund) return null;
  return repo.updateDesignatedFund(targetId, body);
}

export async function deactivateDesignatedFund(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.DesignatedFunds, Action.Delete);
  const fund = await repo.findDesignatedFundById(targetId);
  if (!fund) return null;
  await repo.deactivateDesignatedFund(targetId);
}
