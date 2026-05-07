import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import type { CreateBoardMeetingRequest, UpdateBoardMeetingRequest, SetAgendaRequest, BoardMeetingResponse } from './schema.js';
import type { BoardMeeting } from '../../db/schema.js';

function buildResponse(meeting: BoardMeeting, hasMin: boolean): BoardMeetingResponse {
  return {
    id: meeting.id,
    meetingDate: meeting.meetingDate,
    type: meeting.type as 'ordinária' | 'extraordinária',
    agendaItems: (meeting.agendaContent as string[] | null),
    agendaAuthorId: meeting.agendaAuthorId,
    agendaCreatedAt: meeting.agendaCreatedAt ? meeting.agendaCreatedAt.toISOString() : null,
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
  const responses = await Promise.all(rows.map(async (row) => buildResponse(row, await repo.hasMinutes(row.id))));
  return paginate(responses, total, page, limit);
}

export async function getBoardMeetingById(id: number): Promise<BoardMeetingResponse | null> {
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting) return null;
  return buildResponse(meeting, await repo.hasMinutes(meeting.id));
}

export async function createBoardMeeting(callerId: number, body: CreateBoardMeetingRequest): Promise<BoardMeetingResponse> {
  await assertPermission(callerId, Module.Agendas, Action.Create);
  const created = await repo.insertBoardMeeting({ meetingDate: body.meetingDate, type: body.type, isPublic: body.isPublic });
  if (!created) throw new Error('Failed to create board meeting');
  return buildResponse(created, false);
}

export async function updateBoardMeeting(callerId: number, id: number, body: UpdateBoardMeetingRequest): Promise<BoardMeetingResponse | null> {
  await assertPermission(callerId, Module.Agendas, Action.Update);
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting) return null;
  const updated = await repo.updateBoardMeeting(id, body);
  if (!updated) return null;
  return buildResponse(updated, await repo.hasMinutes(id));
}

export async function setAgenda(callerId: number, id: number, body: SetAgendaRequest): Promise<BoardMeetingResponse | null> {
  await assertPermission(callerId, Module.Agendas, Action.Update);
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting || meeting.status === 'inativo') return null;
  const updated = await repo.setAgenda(id, body.items, callerId);
  if (!updated) return null;
  return buildResponse(updated, await repo.hasMinutes(id));
}

export async function deactivateBoardMeeting(callerId: number, id: number): Promise<void | null> {
  await assertPermission(callerId, Module.Agendas, Action.Delete);
  const meeting = await repo.findBoardMeetingById(id);
  if (!meeting) return null;
  if (await repo.hasMinutes(id)) throw httpError(409, 'Cannot delete a meeting that already has minutes');
  await repo.deactivateBoardMeeting(id);
}
