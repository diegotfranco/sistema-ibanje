import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { paginate } from '../../lib/pagination.js';
import type { CreateEventRequest, UpdateEventRequest, EventResponse } from './schema.js';
import type { Event } from '../../db/schema.js';

function buildResponse(row: Event): EventResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listEvents(
  callerId: number,
  page: number,
  limit: number,
  status?: 'ativo' | 'inativo'
) {
  await assertPermission(callerId, Module.Events, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listEvents(offset, limit, status);
  return paginate(rows.map(buildResponse), total, page, limit);
}

export async function getEventById(callerId: number, id: number): Promise<EventResponse | null> {
  await assertPermission(callerId, Module.Events, Action.View);
  const row = await repo.findEventById(id);
  if (!row) return null;
  return buildResponse(row);
}

export async function createEvent(
  callerId: number,
  body: CreateEventRequest
): Promise<EventResponse> {
  await assertPermission(callerId, Module.Events, Action.Create);
  const created = await repo.insertEvent({
    title: body.title,
    description: body.description ?? null,
    location: body.location ?? null,
    startTime: new Date(body.startTime),
    endTime: new Date(body.endTime)
  });
  if (!created) throw new Error('Failed to create event');
  return buildResponse(created);
}

export async function updateEvent(
  callerId: number,
  id: number,
  body: UpdateEventRequest
): Promise<EventResponse | null> {
  await assertPermission(callerId, Module.Events, Action.Update);
  const updated = await repo.updateEvent(id, {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.location !== undefined && { location: body.location }),
    ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
    ...(body.endTime !== undefined && { endTime: new Date(body.endTime) })
  });
  if (!updated) return null;
  return buildResponse(updated);
}

export async function deactivateEvent(callerId: number, id: number): Promise<void | null> {
  await assertPermission(callerId, Module.Events, Action.Delete);
  const existing = await repo.findEventById(id);
  if (!existing) return null;
  await repo.deactivateEvent(id);
}
