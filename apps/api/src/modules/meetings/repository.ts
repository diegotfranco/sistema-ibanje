import { eq, count, desc, asc, and } from 'drizzle-orm';
import type { MeetingTypeValue } from '@sistema-ibanje/shared';
import { db } from '../../db/index.js';
import { meetings, minutes, agendaItems } from '../../db/schema.js';
import { notDeleted } from '../../lib/softDelete.js';

export async function listMeetings(offset: number, limit: number) {
  const rows = await db
    .select()
    .from(meetings)
    .where(notDeleted(meetings))
    .orderBy(desc(meetings.meetingDate))
    .offset(offset)
    .limit(limit);

  const countResult = await db
    .select({ count: count() })
    .from(meetings)
    .where(notDeleted(meetings));

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findMeetingById(id: number) {
  const result = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, id), notDeleted(meetings)))
    .limit(1);
  return result[0] ?? null;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function insertMeeting(
  data: {
    meetingDate: string;
    type: MeetingTypeValue;
    isPublic: boolean;
  },
  tx?: Tx
) {
  const executor = tx ?? db;
  const result = await executor.insert(meetings).values(data).returning();
  return result[0] ?? null;
}

export async function updateMeeting(
  id: number,
  data: Partial<{ meetingDate: string; type: MeetingTypeValue; isPublic: boolean }>
) {
  const result = await db
    .update(meetings)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(meetings.id, id), notDeleted(meetings)))
    .returning();
  return result[0] ?? null;
}

export async function listAgendaItemsForMeeting(meetingId: number) {
  return await db
    .select()
    .from(agendaItems)
    .where(and(eq(agendaItems.meetingId, meetingId), notDeleted(agendaItems)))
    .orderBy(asc(agendaItems.order));
}

export async function insertAgendaItems(
  meetingId: number,
  items: Array<{ title: string; description?: string | null }>,
  createdByUserId: number,
  tx?: Tx
) {
  const executor = tx ?? db;
  if (items.length === 0) return [];
  const inserted = await executor
    .insert(agendaItems)
    .values(
      items.map((item, idx) => ({
        meetingId,
        order: idx,
        title: item.title,
        description: item.description ?? null,
        createdByUserId
      }))
    )
    .returning();
  return inserted;
}

export async function replaceAgendaItems(
  meetingId: number,
  items: Array<{ title: string; description?: string | null }>,
  createdByUserId: number
) {
  return await db.transaction(async (tx) => {
    await tx.delete(agendaItems).where(eq(agendaItems.meetingId, meetingId));
    return insertAgendaItems(meetingId, items, createdByUserId, tx);
  });
}

export async function softDeleteMeeting(id: number) {
  await db
    .update(meetings)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(meetings.id, id), notDeleted(meetings)));
}

export async function hasMinutes(meetingId: number): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(minutes)
    .where(eq(minutes.meetingId, meetingId));
  return (result[0]?.count ?? 0) > 0;
}
