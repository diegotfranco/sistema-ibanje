import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { Module, Action } from '../../../lib/constants.js';
import { httpError } from '../../../lib/errors.js';
import { paginate } from '../../../lib/pagination.js';
import { FundStatus, type FundStatusValue } from '@sistema-ibanje/shared';
import type {
  CreateDesignatedFundRequest,
  UpdateDesignatedFundRequest,
  DesignatedFundResponse
} from './schema.js';

export async function listDesignatedFunds(
  callerId: number,
  page: number,
  limit: number,
  status?: FundStatusValue
) {
  await assertPermission(callerId, Module.DesignatedFunds, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listDesignatedFunds(offset, limit, status);
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

// Campaign lifecycle — distinct from delete/restore. Gated by Update (editing the campaign),
// not Delete. `encerrar` = the campaign reached its goal/deadline; `reabrir` undoes that.
export async function encerrarDesignatedFund(
  callerId: number,
  targetId: number
): Promise<DesignatedFundResponse | null> {
  await assertPermission(callerId, Module.DesignatedFunds, Action.Update);
  const fund = await repo.findDesignatedFundById(targetId);
  if (!fund) return null;
  if (fund.status === FundStatus.Ended) throw httpError(409, 'A campanha já está encerrada.');
  return repo.updateDesignatedFundStatus(targetId, FundStatus.Ended);
}

export async function reabrirDesignatedFund(
  callerId: number,
  targetId: number
): Promise<DesignatedFundResponse | null> {
  await assertPermission(callerId, Module.DesignatedFunds, Action.Update);
  const fund = await repo.findDesignatedFundById(targetId);
  if (!fund) return null;
  if (fund.status === FundStatus.Active) throw httpError(409, 'A campanha já está ativa.');
  return repo.updateDesignatedFundStatus(targetId, FundStatus.Active);
}

export async function softDeleteDesignatedFund(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.DesignatedFunds, Action.Delete);
  const fund = await repo.findDesignatedFundById(targetId);
  if (!fund) return null;
  await repo.softDeleteDesignatedFund(targetId);
}

// Reverses a soft-delete (clears `deletedAt`). Gated by the same Delete permission: whoever can
// delete a fund can undo it. Resolves against the deleted row directly — `findDesignatedFundById`
// hides deleted rows — so the repo returns null (→ 404) only when the id doesn't exist at all.
export async function restoreDesignatedFund(
  callerId: number,
  targetId: number
): Promise<DesignatedFundResponse | null> {
  await assertPermission(callerId, Module.DesignatedFunds, Action.Delete);
  return repo.restoreDesignatedFund(targetId);
}
