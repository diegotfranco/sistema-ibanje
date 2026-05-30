import { eq, ne, count, desc, asc, and, gte, lte, isNotNull, type SQL } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { calendarEntries, attenders, events } from '../../db/schema.js';

type CalendarEntryInsert = Omit<
  typeof calendarEntries.$inferInsert,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;
type CalendarEntryUpdate = Partial<CalendarEntryInsert>;

export async function listCalendarEntries(
  offset: number,
  limit: number,
  status?: 'ativo' | 'inativo'
) {
  const where: SQL | undefined = status
    ? eq(calendarEntries.status, status)
    : ne(calendarEntries.status, 'inativo');

  const rows = await db
    .select()
    .from(calendarEntries)
    .where(where)
    .orderBy(desc(calendarEntries.date))
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(calendarEntries).where(where);

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findCalendarEntryById(id: number) {
  const result = await db.select().from(calendarEntries).where(eq(calendarEntries.id, id)).limit(1);
  return result[0] ?? null;
}

export async function insertCalendarEntry(data: CalendarEntryInsert) {
  const result = await db.insert(calendarEntries).values(data).returning();
  return result[0] ?? null;
}

export async function updateCalendarEntry(id: number, data: CalendarEntryUpdate) {
  const result = await db
    .update(calendarEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(calendarEntries.id, id), ne(calendarEntries.status, 'inativo')))
    .returning();
  return result[0] ?? null;
}

export async function deactivateCalendarEntry(id: number) {
  await db
    .update(calendarEntries)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(calendarEntries.id, id));
}

// ---- Feed sources (read-only, used by GET /calendar/feed) ----

// Active manual entries whose date falls inside the visible range.
export async function listEntriesInRange(fromISO: string, toISO: string) {
  return db
    .select({
      id: calendarEntries.id,
      title: calendarEntries.title,
      date: calendarEntries.date,
      notes: calendarEntries.notes
    })
    .from(calendarEntries)
    .where(
      and(
        eq(calendarEntries.status, 'ativo'),
        gte(calendarEntries.date, fromISO),
        lte(calendarEntries.date, toISO)
      )
    )
    .orderBy(asc(calendarEntries.date));
}

// Active attenders that have a birth or baptism date — occurrences are expanded in the service.
export async function listAttenderAnniversarySources() {
  return db
    .select({
      id: attenders.id,
      name: attenders.name,
      birthDate: attenders.birthDate,
      baptismDate: attenders.baptismDate
    })
    .from(attenders)
    .where(eq(attenders.status, 'ativo'));
}

// Active events whose start instant falls inside the visible range. The window is widened by a day
// on each side so timezone bucketing near midnight can't drop a boundary event; the service does
// the precise app-local-date filtering.
export async function listEventsInRange(fromInstant: Date, toInstant: Date) {
  return db
    .select({
      id: events.id,
      title: events.title,
      startTime: events.startTime,
      endTime: events.endTime
    })
    .from(events)
    .where(
      and(
        eq(events.status, 'ativo'),
        isNotNull(events.startTime),
        gte(events.startTime, fromInstant),
        lte(events.startTime, toInstant)
      )
    )
    .orderBy(asc(events.startTime));
}
