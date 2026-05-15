import type { MeetingTypeValue } from '@sistema-ibanje/shared';
import * as repo from './repository.js';
import * as minutesRepo from '../minutes/repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { db } from '../../db/index.js';
import type {
  CreateMeetingRequest,
  UpdateMeetingRequest,
  SetAgendaItemsRequest,
  MeetingResponse
} from './schema.js';
import type { Meeting, AgendaItem } from '../../db/schema.js';

function buildResponse(meeting: Meeting, hasMin: boolean, items: AgendaItem[]): MeetingResponse {
  return {
    id: meeting.id,
    meetingDate: meeting.meetingDate,
    type: meeting.type as MeetingTypeValue,
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

export async function listMeetings(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.Agendas, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listMeetings(offset, limit);
  const responses = await Promise.all(
    rows.map(async (row) => {
      const items = await repo.listAgendaItemsForMeeting(row.id);
      return buildResponse(row, await repo.hasMinutes(row.id), items);
    })
  );
  return paginate(responses, total, page, limit);
}

export async function getMeetingById(id: number): Promise<MeetingResponse | null> {
  const meeting = await repo.findMeetingById(id);
  if (!meeting) return null;
  const items = await repo.listAgendaItemsForMeeting(id);
  return buildResponse(meeting, await repo.hasMinutes(meeting.id), items);
}

export async function createMeeting(
  callerId: number,
  body: CreateMeetingRequest
): Promise<MeetingResponse> {
  await assertPermission(callerId, Module.Agendas, Action.Create);

  const result = await db.transaction(async (tx) => {
    const created = await repo.insertMeeting(
      {
        meetingDate: body.meetingDate,
        type: body.type,
        isPublic: body.isPublic
      },
      tx
    );
    if (!created) throw new Error('Failed to create meeting');

    // Look up default template for this meeting type and auto-seed agenda items
    const template = await minutesRepo.findDefaultTemplateForMeetingType(body.type);
    let items: AgendaItem[] = [];
    if (
      template &&
      Array.isArray(template.defaultAgendaItems) &&
      template.defaultAgendaItems.length > 0
    ) {
      items = await repo.insertAgendaItems(created.id, template.defaultAgendaItems, callerId, tx);
    }

    return { meeting: created, items };
  });

  return buildResponse(result.meeting, false, result.items);
}

export async function updateMeeting(
  callerId: number,
  id: number,
  body: UpdateMeetingRequest
): Promise<MeetingResponse | null> {
  await assertPermission(callerId, Module.Agendas, Action.Update);
  const meeting = await repo.findMeetingById(id);
  if (!meeting) return null;
  const updated = await repo.updateMeeting(id, body);
  if (!updated) return null;
  const items = await repo.listAgendaItemsForMeeting(id);
  return buildResponse(updated, await repo.hasMinutes(id), items);
}

export async function setAgendaItems(
  callerId: number,
  id: number,
  body: SetAgendaItemsRequest
): Promise<MeetingResponse | null> {
  await assertPermission(callerId, Module.Agendas, Action.Update);
  const meeting = await repo.findMeetingById(id);
  if (!meeting || meeting.status === 'inativo') return null;
  await repo.replaceAgendaItems(id, body.items, callerId);
  const items = await repo.listAgendaItemsForMeeting(id);
  return buildResponse(meeting, await repo.hasMinutes(id), items);
}

export async function deactivateMeeting(callerId: number, id: number): Promise<void | null> {
  await assertPermission(callerId, Module.Agendas, Action.Delete);
  const meeting = await repo.findMeetingById(id);
  if (!meeting) return null;
  if (await repo.hasMinutes(id))
    throw httpError(409, 'Cannot delete a meeting that already has minutes');
  await repo.deactivateMeeting(id);
}
