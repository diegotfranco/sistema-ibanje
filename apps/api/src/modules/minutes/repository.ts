import { eq, asc, desc, count, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { minutes, minuteVersions, boardMeetings } from '../../db/schema.js';
import type { Minute, MinuteVersion } from '../../db/schema.js';

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
    content: { text: string };
    version: number;
    status?: 'aguardando aprovação' | 'aprovada' | 'substituída';
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
    content: { text: string };
    status: 'aguardando aprovação' | 'aprovada' | 'substituída';
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

export async function findBoardMeetingById(id: number) {
  const result = await db
    .select({ id: boardMeetings.id, status: boardMeetings.status })
    .from(boardMeetings)
    .where(eq(boardMeetings.id, id))
    .limit(1);
  return result[0] ?? null;
}
