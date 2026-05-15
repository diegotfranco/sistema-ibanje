import { eq, ne, count, desc, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { boardMeetings, minutes, agendaItems } from '../../db/schema.js';

export async function listBoardMeetings(offset: number, limit: number) {
  const rows = await db
    .select()
    .from(boardMeetings)
    .where(ne(boardMeetings.status, 'inativo'))
    .orderBy(desc(boardMeetings.meetingDate))
    .offset(offset)
    .limit(limit);

  const countResult = await db
    .select({ count: count() })
    .from(boardMeetings)
    .where(ne(boardMeetings.status, 'inativo'));

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findBoardMeetingById(id: number) {
  const result = await db.select().from(boardMeetings).where(eq(boardMeetings.id, id)).limit(1);
  return result[0] ?? null;
}

export async function insertBoardMeeting(data: {
  meetingDate: string;
  type: 'ordinária' | 'extraordinária';
  isPublic: boolean;
}) {
  const result = await db.insert(boardMeetings).values(data).returning();
  return result[0] ?? null;
}

export async function updateBoardMeeting(
  id: number,
  data: Partial<{ meetingDate: string; type: 'ordinária' | 'extraordinária'; isPublic: boolean }>
) {
  const result = await db
    .update(boardMeetings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(boardMeetings.id, id))
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

export async function deactivateBoardMeeting(id: number) {
  await db
    .update(boardMeetings)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(boardMeetings.id, id));
}

export async function hasMinutes(boardMeetingId: number): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(minutes)
    .where(eq(minutes.boardMeetingId, boardMeetingId));
  return (result[0]?.count ?? 0) > 0;
}
