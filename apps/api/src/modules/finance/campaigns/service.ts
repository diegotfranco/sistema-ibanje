import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { Module, Action } from '../../../lib/constants.js';
import { httpError } from '../../../lib/errors.js';
import { paginate } from '../../../lib/pagination.js';
import { CampaignStatus, type CampaignStatusValue } from '@sistema-ibanje/shared';
import type { CreateCampaignRequest, UpdateCampaignRequest, CampaignResponse } from './schema.js';

export async function listCampaigns(
  callerId: number,
  page: number,
  limit: number,
  status?: CampaignStatusValue
) {
  await assertPermission(callerId, Module.Campaigns, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listCampaigns(offset, limit, status);
  return paginate(
    rows.map((r): CampaignResponse => r),
    total,
    page,
    limit
  );
}

export async function getCampaignById(id: number): Promise<CampaignResponse | null> {
  return repo.findCampaignById(id);
}

export async function createCampaign(
  callerId: number,
  body: CreateCampaignRequest
): Promise<CampaignResponse> {
  await assertPermission(callerId, Module.Campaigns, Action.Create);
  const created = await repo.insertCampaign(body);
  if (!created) throw new Error('Failed to create campaign');
  return created;
}

export async function updateCampaign(
  callerId: number,
  targetId: number,
  body: UpdateCampaignRequest
): Promise<CampaignResponse | null> {
  await assertPermission(callerId, Module.Campaigns, Action.Update);
  const campaign = await repo.findCampaignById(targetId);
  if (!campaign) return null;
  return repo.updateCampaign(targetId, body);
}

// Campaign lifecycle — distinct from delete/restore. Gated by Update (editing the campaign),
// not Delete. `encerrar` = the campaign reached its goal/deadline; `reabrir` undoes that.
export async function encerrarCampaign(
  callerId: number,
  targetId: number
): Promise<CampaignResponse | null> {
  await assertPermission(callerId, Module.Campaigns, Action.Update);
  const campaign = await repo.findCampaignById(targetId);
  if (!campaign) return null;
  if (campaign.status === CampaignStatus.Ended)
    throw httpError(409, 'A campanha já está encerrada.');
  return repo.updateCampaignStatus(targetId, CampaignStatus.Ended);
}

export async function reabrirCampaign(
  callerId: number,
  targetId: number
): Promise<CampaignResponse | null> {
  await assertPermission(callerId, Module.Campaigns, Action.Update);
  const campaign = await repo.findCampaignById(targetId);
  if (!campaign) return null;
  if (campaign.status === CampaignStatus.Active) throw httpError(409, 'A campanha já está ativa.');
  return repo.updateCampaignStatus(targetId, CampaignStatus.Active);
}

export async function softDeleteCampaign(callerId: number, targetId: number): Promise<void | null> {
  await assertPermission(callerId, Module.Campaigns, Action.Delete);
  const campaign = await repo.findCampaignById(targetId);
  if (!campaign) return null;
  await repo.softDeleteCampaign(targetId);
}

// Reverses a soft-delete (clears `deletedAt`). Gated by the same Delete permission: whoever can
// delete a campaign can undo it. Resolves against the deleted row directly — `findCampaignById`
// hides deleted rows — so the repo returns null (→ 404) only when the id doesn't exist at all.
export async function restoreCampaign(
  callerId: number,
  targetId: number
): Promise<CampaignResponse | null> {
  await assertPermission(callerId, Module.Campaigns, Action.Delete);
  return repo.restoreCampaign(targetId);
}
