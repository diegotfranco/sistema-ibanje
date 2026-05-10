import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { ActiveStatus, MinuteStatus } from '@sistema-ibanje/shared';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { db } from '../../db/index.js';
import type {
  CreateMinuteRequest,
  UpdateMinuteVersionRequest,
  EditApprovedMinuteRequest,
  ApproveMinuteRequest,
  MinuteVersionResponse,
  MinuteResponse
} from './schema.js';
import type { Minute, MinuteVersion } from '../../db/schema.js';

function buildVersionResponse(v: MinuteVersion): MinuteVersionResponse {
  return {
    id: v.id,
    version: v.version,
    content: (v.content as { text: string }).text,
    status: v.status as MinuteVersionResponse['status'],
    reasonForChange: v.reasonForChange ?? null,
    createdByUserId: v.createdByUserId,
    approvedAtMeetingId: v.approvedAtMeetingId ?? null,
    createdAt: v.createdAt.toISOString()
  };
}

function buildMinuteResponse(minute: Minute, versions: MinuteVersion[]): MinuteResponse {
  const sorted = [...versions].sort((a, b) => a.version - b.version);
  const currentVersion =
    sorted.length > 0 ? buildVersionResponse(sorted[sorted.length - 1]!) : null;
  return {
    id: minute.id,
    boardMeetingId: minute.boardMeetingId,
    minuteNumber: minute.minuteNumber,
    isNotarized: minute.isNotarized,
    notarizedAt: minute.notarizedAt ? minute.notarizedAt.toISOString() : null,
    correctsMinuteId: minute.correctsMinuteId ?? null,
    currentVersion,
    versions: sorted.map(buildVersionResponse),
    createdAt: minute.createdAt.toISOString(),
    updatedAt: minute.updatedAt.toISOString()
  };
}

export async function listMinutes(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.Minutes, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listMinutes(offset, limit);
  const latestByMinute = await repo.findLatestVersionsForMinutes(rows.map((r) => r.id));
  const responses = rows.map((row) => {
    const latest = latestByMinute.get(row.id);
    return buildMinuteResponse(row, latest ? [latest] : []);
  });
  return paginate(responses, total, page, limit);
}

export async function getMinuteById(id: number): Promise<MinuteResponse | null> {
  const minute = await repo.findMinuteById(id);
  if (!minute) return null;
  const versions = await repo.getVersionsForMinute(id);
  return buildMinuteResponse(minute, versions);
}

export async function createMinute(
  callerId: number,
  body: CreateMinuteRequest
): Promise<MinuteResponse> {
  await assertPermission(callerId, Module.Minutes, Action.Create);

  const meeting = await repo.findBoardMeetingById(body.boardMeetingId);
  if (!meeting) throw httpError(404, 'Board meeting not found');
  if (meeting.status === ActiveStatus.Inactive) throw httpError(400, 'Board meeting is inactive');

  if (await repo.findMinuteByNumber(body.minuteNumber))
    throw httpError(409, 'Minute number already exists');
  if (await repo.findMinuteByBoardMeetingId(body.boardMeetingId))
    throw httpError(409, 'This meeting already has minutes');

  return await db.transaction(async (tx) => {
    const minute = await repo.insertMinute(
      {
        boardMeetingId: body.boardMeetingId,
        minuteNumber: body.minuteNumber
      },
      tx
    );
    const version = await repo.insertMinuteVersion(
      {
        minuteId: minute.id,
        content: { text: body.content },
        version: 1,
        status: MinuteStatus.AwaitingApproval,
        createdByUserId: callerId
      },
      tx
    );

    return buildMinuteResponse(minute, [version]);
  });
}

export async function updatePendingVersion(
  callerId: number,
  minuteId: number,
  body: UpdateMinuteVersionRequest
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const latest = await repo.findLatestVersion(minuteId);
  if (!latest || latest.status !== MinuteStatus.AwaitingApproval)
    throw httpError(409, 'No pending version to update');

  await repo.updateMinuteVersion(latest.id, { content: { text: body.content } });
  const versions = await repo.getVersionsForMinute(minuteId);
  return buildMinuteResponse(minute, versions);
}

export async function editApprovedMinute(
  callerId: number,
  minuteId: number,
  body: EditApprovedMinuteRequest
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Update);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const latest = await repo.findLatestVersion(minuteId);
  if (!latest || latest.status !== MinuteStatus.Approved)
    throw httpError(409, 'Latest version must be approved to create a new one');

  return await db.transaction(async (tx) => {
    await repo.updateMinuteVersion(latest.id, { status: MinuteStatus.Replaced }, tx);
    await repo.insertMinuteVersion(
      {
        minuteId,
        content: { text: body.content },
        version: latest.version + 1,
        status: MinuteStatus.AwaitingApproval,
        reasonForChange: body.reasonForChange,
        createdByUserId: callerId
      },
      tx
    );

    const versions = await repo.getVersionsForMinute(minuteId);
    return buildMinuteResponse(minute, versions);
  });
}

export async function approveMinute(
  callerId: number,
  minuteId: number,
  body: ApproveMinuteRequest
): Promise<MinuteResponse | null> {
  await assertPermission(callerId, Module.Minutes, Action.Review);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const latest = await repo.findLatestVersion(minuteId);
  if (!latest || latest.status !== MinuteStatus.AwaitingApproval)
    throw httpError(409, 'No pending version to approve');

  await repo.updateMinuteVersion(latest.id, {
    status: MinuteStatus.Approved,
    approvedAtMeetingId: body.approvedAtMeetingId ?? null
  });

  const versions = await repo.getVersionsForMinute(minuteId);
  return buildMinuteResponse(minute, versions);
}

export async function deleteMinute(callerId: number, minuteId: number): Promise<void | null> {
  await assertPermission(callerId, Module.Minutes, Action.Delete);
  const minute = await repo.findMinuteById(minuteId);
  if (!minute) return null;

  const versions = await repo.getVersionsForMinute(minuteId);
  if (versions.some((v) => v.status === MinuteStatus.Approved))
    throw httpError(409, 'Cannot delete a minute with an approved version');

  await repo.deleteMinute(minuteId);
}
