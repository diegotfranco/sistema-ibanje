import { eq, and, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { membershipLetters } from '../../db/schema.js';

const MEMBERSHIP_LETTER_COLUMNS = {
  id: membershipLetters.id,
  attenderId: membershipLetters.attenderId,
  type: membershipLetters.type,
  letterDate: membershipLetters.letterDate,
  otherChurchName: membershipLetters.otherChurchName,
  otherChurchAddress: membershipLetters.otherChurchAddress,
  otherChurchCity: membershipLetters.otherChurchCity,
  otherChurchState: membershipLetters.otherChurchState,
  signingSecretaryName: membershipLetters.signingSecretaryName,
  signingSecretaryTitle: membershipLetters.signingSecretaryTitle,
  signingPresidentName: membershipLetters.signingPresidentName,
  signingPresidentTitle: membershipLetters.signingPresidentTitle,
  additionalContext: membershipLetters.additionalContext,
  createdByUserId: membershipLetters.createdByUserId,
  createdAt: membershipLetters.createdAt,
  updatedAt: membershipLetters.updatedAt
};

export async function listMembershipLetters(
  offset: number,
  limit: number,
  attenderId?: number,
  type?: string
) {
  const conditions = [];
  if (attenderId !== undefined) {
    conditions.push(eq(membershipLetters.attenderId, attenderId));
  }
  if (type !== undefined) {
    conditions.push(eq(membershipLetters.type, type as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select(MEMBERSHIP_LETTER_COLUMNS)
    .from(membershipLetters)
    .$dynamic()
    .where(whereClause)
    .orderBy(membershipLetters.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db
    .select({ count: count() })
    .from(membershipLetters)
    .$dynamic()
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  return { rows, total };
}

export async function findMembershipLetterById(id: number) {
  const result = await db
    .select(MEMBERSHIP_LETTER_COLUMNS)
    .from(membershipLetters)
    .where(eq(membershipLetters.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function insertMembershipLetter(
  data: Omit<typeof membershipLetters.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>
) {
  const result = await db
    .insert(membershipLetters)
    .values(data)
    .returning(MEMBERSHIP_LETTER_COLUMNS);

  return result[0] ?? null;
}

export async function updateMembershipLetter(
  id: number,
  data: Partial<
    Omit<typeof membershipLetters.$inferInsert, 'id' | 'attenderId' | 'type' | 'createdByUserId' | 'createdAt' | 'updatedAt' | 'signingSecretaryName' | 'signingSecretaryTitle' | 'signingPresidentName' | 'signingPresidentTitle'>
  >
) {
  const result = await db
    .update(membershipLetters)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(membershipLetters.id, id))
    .returning(MEMBERSHIP_LETTER_COLUMNS);

  return result[0] ?? null;
}

export async function deleteMembershipLetter(id: number) {
  await db.delete(membershipLetters).where(eq(membershipLetters.id, id));
}
