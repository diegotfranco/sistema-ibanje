import { eq, asc, desc, count, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { minutes, minuteVersions, boardMeetings, minuteTemplates, agendaItems } from '../../db/schema.js';
import type { Minute, MinuteVersion, MinuteTemplate } from '../../db/schema.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function listMinutes(offset: number, limit: number) {
  const rows = await db
    .select()
    .from(minutes)
    .orderBy(desc(minutes.createdAt))
    .offset(offset)
    .limit(limit);
  const countResult = await db.select({ count: count() }).from(minutes);
  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findMinuteById(id: number): Promise<Minute | null> {
  const result = await db.select().from(minutes).where(eq(minutes.id, id)).limit(1);
  return result[0] ?? null;
}

export async function findMinuteByBoardMeetingId(boardMeetingId: number): Promise<Minute | null> {
  const result = await db
    .select()
    .from(minutes)
    .where(eq(minutes.boardMeetingId, boardMeetingId))
    .limit(1);
  return result[0] ?? null;
}

export async function findMinuteByNumber(minuteNumber: string): Promise<Minute | null> {
  const result = await db
    .select()
    .from(minutes)
    .where(eq(minutes.minuteNumber, minuteNumber))
    .limit(1);
  return result[0] ?? null;
}

export async function insertMinute(
  data: {
    boardMeetingId: number;
    minuteNumber: string;
    presidingPastorName?: string | null;
    secretaryName?: string | null;
    openingHymnReference?: string | null;
    openingBibleReference?: string | null;
    openingTime?: string | null;
    closingTime?: string | null;
    membersPresentCount?: number | null;
  },
  tx?: Tx
): Promise<Minute> {
  const executor = tx ?? db;
  const result = await executor.insert(minutes).values(data).returning();
  return result[0]!;
}

export async function deleteMinute(id: number): Promise<void> {
  await db.delete(minutes).where(eq(minutes.id, id));
}

export async function getVersionsForMinute(minuteId: number): Promise<MinuteVersion[]> {
  return db
    .select()
    .from(minuteVersions)
    .where(eq(minuteVersions.minuteId, minuteId))
    .orderBy(asc(minuteVersions.version));
}

export async function findLatestVersion(minuteId: number): Promise<MinuteVersion | null> {
  const result = await db
    .select()
    .from(minuteVersions)
    .where(eq(minuteVersions.minuteId, minuteId))
    .orderBy(desc(minuteVersions.version))
    .limit(1);
  return result[0] ?? null;
}

export async function findLatestVersionsForMinutes(
  minuteIds: number[]
): Promise<Map<number, MinuteVersion>> {
  if (minuteIds.length === 0) return new Map();
  const rows = await db
    .selectDistinctOn([minuteVersions.minuteId])
    .from(minuteVersions)
    .where(inArray(minuteVersions.minuteId, minuteIds))
    .orderBy(minuteVersions.minuteId, desc(minuteVersions.version));
  return new Map(rows.map((r) => [r.minuteId, r]));
}

export async function insertMinuteVersion(
  data: {
    minuteId: number;
    content: unknown;
    version: number;
    status?: 'rascunho' | 'aguardando aprovação' | 'aprovada' | 'substituída';
    reasonForChange?: string;
    createdByUserId: number;
    approvedAtMeetingId?: number;
  },
  tx?: Tx
): Promise<MinuteVersion> {
  const executor = tx ?? db;
  const result = await executor.insert(minuteVersions).values(data).returning();
  return result[0]!;
}

export async function updateMinuteVersion(
  id: number,
  data: Partial<{
    content: unknown;
    status: 'rascunho' | 'aguardando aprovação' | 'aprovada' | 'substituída';
    approvedAtMeetingId: number | null;
  }>,
  tx?: Tx
): Promise<MinuteVersion | null> {
  const executor = tx ?? db;
  const result = await executor
    .update(minuteVersions)
    .set(data)
    .where(eq(minuteVersions.id, id))
    .returning();
  return result[0] ?? null;
}

export async function updateMinute(
  id: number,
  data: Partial<{
    presidingPastorName: string | null;
    secretaryName: string | null;
    openingHymnReference: string | null;
    openingBibleReference: string | null;
    openingTime: string | null;
    closingTime: string | null;
    membersPresentCount: number | null;
    signedDocumentPath: string | null;
  }>,
  tx?: Tx
): Promise<Minute | null> {
  const executor = tx ?? db;
  const result = await executor
    .update(minutes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(minutes.id, id))
    .returning();
  return result[0] ?? null;
}

export async function findBoardMeetingById(id: number) {
  const result = await db
    .select({ id: boardMeetings.id, status: boardMeetings.status, type: boardMeetings.type, meetingDate: boardMeetings.meetingDate })
    .from(boardMeetings)
    .where(eq(boardMeetings.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function findDefaultTemplateForMeetingType(meetingType: string): Promise<MinuteTemplate | null> {
  const result = await db
    .select()
    .from(minuteTemplates)
    .where(eq(minuteTemplates.meetingType, meetingType as any))
    .limit(1);
  return result[0] ?? null;
}

export async function listAgendaItemsForMeeting(meetingId: number) {
  return db
    .select()
    .from(agendaItems)
    .where(eq(agendaItems.meetingId, meetingId))
    .orderBy(asc(agendaItems.order));
}

export async function findLatestMinuteByNumber(minuteNumber: string) {
  const result = await db
    .select({ minuteNumber: minutes.minuteNumber })
    .from(minutes)
    .orderBy(desc(minutes.minuteNumber))
    .limit(1);
  return result[0] ?? null;
}

export async function listMinuteTemplates() {
  return db.select().from(minuteTemplates).orderBy(asc(minuteTemplates.meetingType), desc(minuteTemplates.isDefault));
}

export async function findMinuteTemplateById(id: number): Promise<MinuteTemplate | null> {
  const result = await db.select().from(minuteTemplates).where(eq(minuteTemplates.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateMinuteTemplate(
  id: number,
  data: Partial<{
    name: string;
    content: unknown;
    isDefault: boolean;
  }>,
  tx?: Tx
): Promise<MinuteTemplate | null> {
  const executor = tx ?? db;
  const result = await executor
    .update(minuteTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(minuteTemplates.id, id))
    .returning();
  return result[0] ?? null;
}
