import { eq, ne, count, desc, asc } from 'drizzle-orm';
import type { MeetingTypeValue } from '@sistema-ibanje/shared';
import { db } from '../../db/index.js';
import { meetings, minutes, agendaItems } from '../../db/schema.js';

export async function listMeetings(offset: number, limit: number) {
  const rows = await db
    .select()
    .from(meetings)
    .where(ne(meetings.status, 'inativo'))
    .orderBy(desc(meetings.meetingDate))
    .offset(offset)
    .limit(limit);

  const countResult = await db
    .select({ count: count() })
    .from(meetings)
    .where(ne(meetings.status, 'inativo'));

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findMeetingById(id: number) {
  const result = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return result[0] ?? null;
}

export async function insertMeeting(data: {
  meetingDate: string;
  type: MeetingTypeValue;
  isPublic: boolean;
}) {
  const result = await db.insert(meetings).values(data).returning();
  return result[0] ?? null;
}

export async function updateMeeting(
  id: number,
  data: Partial<{ meetingDate: string; type: MeetingTypeValue; isPublic: boolean }>
) {
  const result = await db
    .update(meetings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(meetings.id, id))
    .returning();
  return result[0] ?? null;
}

export async function listAgendaItemsForMeeting(meetingId: number) {
  return await db
    .select()
    .from(agendaItems)
    .where(eq(agendaItems.meetingId, meetingId))
    .orderBy(asc(agendaItems.order));
}

export async function replaceAgendaItems(
  meetingId: number,
  items: Array<{ title: string; description?: string | null }>,
  createdByUserId: number
) {
  return await db.transaction(async (tx) => {
    await tx.delete(agendaItems).where(eq(agendaItems.meetingId, meetingId));
    if (items.length === 0) return [];
    const inserted = await tx
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
  });
}

export async function deactivateMeeting(id: number) {
  await db
    .update(meetings)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(meetings.id, id));
}

export async function hasMinutes(meetingId: number): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(minutes)
    .where(eq(minutes.meetingId, meetingId));
  return (result[0]?.count ?? 0) > 0;
}
