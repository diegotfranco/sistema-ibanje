import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import type {
  CreateBoardMeetingRequest,
  UpdateBoardMeetingRequest,
  SetAgendaItemsRequest,
  BoardMeetingResponse
} from './schema.js';
import type { BoardMeeting, AgendaItem } from '../../db/schema.js';

function buildResponse(
  meeting: BoardMeeting,
  hasMin: boolean,
  items: AgendaItem[]
): BoardMeetingResponse {
  return {
    id: meeting.id,
    meetingDate: meeting.meetingDate,
    type: meeting.type as 'ordinária' | 'extraordinária',
    agendaItems: items.map((it) => ({
      id: it.id,
      meetingId: it.meetingId,
      order: it.order,
      title: it.title,
      description: it.description,
      createdByUserId: it.createdByUserId,
      status: it.status,
      createdAt: it.createdAt.toISOString(),
      updatedAt: it.updatedAt.toISOString()
    })),
    isPublic: meeting.isPublic,
    status: meeting.status,
    hasMinutes: hasMin,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString()
  };
}

export async function listBoardMeetings(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.Agendas, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listBoardMeetings(offset, limit);
  const responses = await Promise.all(
    rows.map(async (row) => {
      const items = await repo.listAgendaItemsForMeeting(row.id);
      return buildResponse(row, await repo.hasMinutes(row.id), items);
    })
  );
  return paginate(responses, total, page, limit);
}

export async function getBoardMeetingById(id: number): Promise<BoardMeetingResponse | null> {
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting) return null;
  const items = await repo.listAgendaItemsForMeeting(id);
  return buildResponse(meeting, await repo.hasMinutes(meeting.id), items);
}

export async function createBoardMeeting(
  callerId: number,
  body: CreateBoardMeetingRequest
): Promise<BoardMeetingResponse> {
  await assertPermission(callerId, Module.Agendas, Action.Create);
  const created = await repo.insertBoardMeeting({
    meetingDate: body.meetingDate,
    type: body.type,
    isPublic: body.isPublic
  });
  if (!created) throw new Error('Failed to create board meeting');
  return buildResponse(created, false, []);
}

export async function updateBoardMeeting(
  callerId: number,
  id: number,
  body: UpdateBoardMeetingRequest
): Promise<BoardMeetingResponse | null> {
  await assertPermission(callerId, Module.Agendas, Action.Update);
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting) return null;
  const updated = await repo.updateBoardMeeting(id, body);
  if (!updated) return null;
  const items = await repo.listAgendaItemsForMeeting(id);
  return buildResponse(updated, await repo.hasMinutes(id), items);
}

export async function setAgendaItems(
  callerId: number,
  id: number,
  body: SetAgendaItemsRequest
): Promise<BoardMeetingResponse | null> {
  await assertPermission(callerId, Module.Agendas, Action.Update);
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting || meeting.status === 'inativo') return null;
  await repo.replaceAgendaItems(id, body.items, callerId);
  const items = await repo.listAgendaItemsForMeeting(id);
  return buildResponse(meeting, await repo.hasMinutes(id), items);
}

export async function deactivateBoardMeeting(callerId: number, id: number): Promise<void | null> {
  await assertPermission(callerId, Module.Agendas, Action.Delete);
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting) return null;
  if (await repo.hasMinutes(id))
    throw httpError(409, 'Cannot delete a meeting that already has minutes');
  await repo.deactivateBoardMeeting(id);
}
