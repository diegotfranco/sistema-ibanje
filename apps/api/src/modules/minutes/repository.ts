import { eq, asc, desc, count, inArray } from 'drizzle-orm';
import type { MeetingTypeValue } from '@sistema-ibanje/shared';
import { db } from '../../db/index.js';
import {
  minutes,
  minuteVersions,
  meetings,
  minuteTemplates,
  agendaItems,
  meetingAttendersPresent,
  attenders
} from '../../db/schema.js';
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

export async function findMinuteByMeetingId(meetingId: number): Promise<Minute | null> {
  const result = await db.select().from(minutes).where(eq(minutes.meetingId, meetingId)).limit(1);
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
    meetingId: number;
    minuteNumber: string;
    presidingPastorName?: string | null;
    secretaryName?: string | null;
    openingTime?: string | null;
    closingTime?: string | null;
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

export async function findMeetingById(id: number) {
  const result = await db
    .select({
      id: meetings.id,
      status: meetings.status,
      type: meetings.type,
      meetingDate: meetings.meetingDate
    })
    .from(meetings)
    .where(eq(meetings.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function findDefaultTemplateForMeetingType(
  meetingType: string
): Promise<MinuteTemplate | null> {
  const result = await db
    .select()
    .from(minuteTemplates)
    .where(eq(minuteTemplates.meetingType, meetingType as MeetingTypeValue))
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

export async function findLatestMinuteByNumber() {
  const result = await db
    .select({ minuteNumber: minutes.minuteNumber })
    .from(minutes)
    .orderBy(desc(minutes.minuteNumber))
    .limit(1);
  return result[0] ?? null;
}

export async function listMinuteTemplates() {
  return db
    .select()
    .from(minuteTemplates)
    .orderBy(asc(minuteTemplates.meetingType), desc(minuteTemplates.isDefault));
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
    defaultAgendaItems: Array<{ title: string; description?: string | null }>;
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

export async function createMinuteTemplate(
  data: {
    meetingType: string;
    name: string;
    content: unknown;
    isDefault?: boolean;
    defaultAgendaItems?: Array<{ title: string; description?: string | null }>;
    createdByUserId: number;
  },
  tx?: Tx
): Promise<MinuteTemplate> {
  const executor = tx ?? db;
  const result = await executor
    .insert(minuteTemplates)
    .values({
      meetingType: data.meetingType as MeetingTypeValue,
      name: data.name,
      content: data.content,
      isDefault: data.isDefault ?? false,
      defaultAgendaItems: data.defaultAgendaItems ?? [],
      createdByUserId: data.createdByUserId
    })
    .returning();
  return result[0]!;
}

export async function deleteMinuteTemplate(id: number, tx?: Tx): Promise<void> {
  const executor = tx ?? db;
  await executor.delete(minuteTemplates).where(eq(minuteTemplates.id, id));
}

export async function clearDefaultForMeetingType(meetingType: string, tx?: Tx): Promise<void> {
  const executor = tx ?? db;
  await executor
    .update(minuteTemplates)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(minuteTemplates.meetingType, meetingType as MeetingTypeValue));
}

export async function findMostRecentMinute(): Promise<Minute | null> {
  const result = await db.select().from(minutes).orderBy(desc(minutes.id)).limit(1);
  return result[0] ?? null;
}

export async function getPreviousApprovedMinuteNumber(): Promise<string> {
  const latestVersions = await findLatestVersionsForMinutes(
    await db
      .select({ id: minutes.id })
      .from(minutes)
      .then((rows) => rows.map((r) => r.id))
  );

  for (const [, version] of latestVersions) {
    if (version.status === 'aprovada') {
      const minute = await findMinuteById(version.minuteId);
      if (minute) {
        return minute.minuteNumber;
      }
    }
  }
  return '';
}

export async function getMeetingAttendersPresent(
  meetingId: number
): Promise<Array<{ id: number; name: string }>> {
  return db
    .select({ id: attenders.id, name: attenders.name })
    .from(meetingAttendersPresent)
    .innerJoin(attenders, eq(meetingAttendersPresent.attenderId, attenders.id))
    .where(eq(meetingAttendersPresent.meetingId, meetingId))
    .orderBy(asc(attenders.name));
}

export async function setMeetingAttendersPresent(
  meetingId: number,
  attenderIds: number[]
): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete existing attendance records for this meeting
    await tx
      .delete(meetingAttendersPresent)
      .where(eq(meetingAttendersPresent.meetingId, meetingId));

    // Insert new attendance records
    if (attenderIds.length > 0) {
      await tx.insert(meetingAttendersPresent).values(
        attenderIds.map((attenderId) => ({
          meetingId,
          attenderId
        }))
      );
    }
  });
}
