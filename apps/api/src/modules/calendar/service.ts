import * as repo from './repository.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { paginate } from '../../lib/pagination.js';
import { utcToAppLocalDate } from '../../lib/datetime.js';
import type {
  CreateCalendarEntryRequest,
  UpdateCalendarEntryRequest,
  CalendarEntryResponse,
  CalendarFeedItem
} from './schema.js';
import type { CalendarEntry } from '../../db/schema.js';

function buildResponse(row: CalendarEntry): CalendarEntryResponse {
  return {
    id: row.id,
    title: row.title,
    date: row.date, // already a YYYY-MM-DD string from the `date` column
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listCalendarEntries(
  callerId: number,
  page: number,
  limit: number,
  status?: 'ativo' | 'inativo'
) {
  await assertPermission(callerId, Module.SecretaryCalendar, Action.View);
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listCalendarEntries(offset, limit, status);
  return paginate(rows.map(buildResponse), total, page, limit);
}

export async function getCalendarEntryById(
  callerId: number,
  id: number
): Promise<CalendarEntryResponse | null> {
  await assertPermission(callerId, Module.SecretaryCalendar, Action.View);
  const row = await repo.findCalendarEntryById(id);
  if (!row) return null;
  return buildResponse(row);
}

export async function createCalendarEntry(
  callerId: number,
  body: CreateCalendarEntryRequest
): Promise<CalendarEntryResponse> {
  await assertPermission(callerId, Module.SecretaryCalendar, Action.Create);
  const created = await repo.insertCalendarEntry({
    title: body.title,
    date: body.date,
    notes: body.notes ?? null
  });
  if (!created) throw new Error('Failed to create calendar entry');
  return buildResponse(created);
}

export async function updateCalendarEntry(
  callerId: number,
  id: number,
  body: UpdateCalendarEntryRequest
): Promise<CalendarEntryResponse | null> {
  await assertPermission(callerId, Module.SecretaryCalendar, Action.Update);
  const updated = await repo.updateCalendarEntry(id, {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.date !== undefined && { date: body.date }),
    ...(body.notes !== undefined && { notes: body.notes })
  });
  if (!updated) return null;
  return buildResponse(updated);
}

export async function deactivateCalendarEntry(callerId: number, id: number): Promise<void | null> {
  await assertPermission(callerId, Module.SecretaryCalendar, Action.Delete);
  const existing = await repo.findCalendarEntryById(id);
  if (!existing) return null;
  await repo.deactivateCalendarEntry(id);
}

// ---- Merged feed (auth-only; no module permission) ----

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Yearly occurrences of a source date's month/day that fall within [fromISO, toISO]. Feb-29 sources
// collapse to Feb-28 in non-leap years. Strings are zero-padded so lexical compare == date compare.
function occurrencesInRange(sourceDateISO: string, fromISO: string, toISO: string): string[] {
  const month = Number.parseInt(sourceDateISO.slice(5, 7), 10);
  const day = Number.parseInt(sourceDateISO.slice(8, 10), 10);
  const fromYear = Number.parseInt(fromISO.slice(0, 4), 10);
  const toYear = Number.parseInt(toISO.slice(0, 4), 10);
  const out: string[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    const effDay = month === 2 && day === 29 && !isLeap(year) ? 28 : day;
    const candidate = `${year}-${String(month).padStart(2, '0')}-${String(effDay).padStart(2, '0')}`;
    if (candidate >= fromISO && candidate <= toISO) out.push(candidate);
  }
  return out;
}

export async function getFeed(fromISO: string, toISO: string): Promise<CalendarFeedItem[]> {
  const items: CalendarFeedItem[] = [];

  // 1. Manual entries (editable).
  const manual = await repo.listEntriesInRange(fromISO, toISO);
  for (const e of manual) {
    items.push({ id: e.id, title: e.title, date: e.date, type: 'lembrete', notes: e.notes });
  }

  // 2. Derived attender birthdays + baptism anniversaries (read-only).
  const sources = await repo.listAttenderAnniversarySources();
  for (const a of sources) {
    if (a.birthDate) {
      for (const date of occurrencesInRange(a.birthDate, fromISO, toISO)) {
        items.push({ id: null, attenderId: a.id, title: a.name, date, type: 'aniversario' });
      }
    }
    if (a.baptismDate) {
      for (const date of occurrencesInRange(a.baptismDate, fromISO, toISO)) {
        items.push({ id: null, attenderId: a.id, title: a.name, date, type: 'batismo' });
      }
    }
  }

  // 3. Finance events on their app-local start date (read-only). Query a widened instant window,
  // then keep events whose local calendar day lands inside the requested range.
  const fromInstant = new Date(`${fromISO}T00:00:00Z`);
  fromInstant.setUTCDate(fromInstant.getUTCDate() - 1);
  const toInstant = new Date(`${toISO}T00:00:00Z`);
  toInstant.setUTCDate(toInstant.getUTCDate() + 2);
  const eventRows = await repo.listEventsInRange(fromInstant, toInstant);
  for (const ev of eventRows) {
    const date = utcToAppLocalDate(ev.startTime);
    if (date >= fromISO && date <= toISO) {
      items.push({ id: null, eventId: ev.id, title: ev.title, date, type: 'evento' });
    }
  }

  items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return items;
}
