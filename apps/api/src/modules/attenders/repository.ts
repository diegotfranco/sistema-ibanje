import { eq, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { attenders } from '../../db/schema.js';

const ATTENDER_COLUMNS = {
  id: attenders.id,
  userId: attenders.userId,
  name: attenders.name,
  birthDate: attenders.birthDate,
  addressStreet: attenders.addressStreet,
  addressNumber: attenders.addressNumber,
  addressComplement: attenders.addressComplement,
  addressDistrict: attenders.addressDistrict,
  state: attenders.state,
  city: attenders.city,
  postalCode: attenders.postalCode,
  email: attenders.email,
  phone: attenders.phone,
  status: attenders.status,
  isMember: attenders.isMember,
  memberSince: attenders.memberSince,
  congregatingSinceYear: attenders.congregatingSinceYear,
  admissionMode: attenders.admissionMode,
  createdAt: attenders.createdAt,
  updatedAt: attenders.updatedAt
};

export async function listAttenders(offset: number, limit: number) {
  const rows = await db
    .select(ATTENDER_COLUMNS)
    .from(attenders)
    .orderBy(attenders.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(attenders);

  const total = countResult[0]?.count ?? 0;

  return { rows, total };
}

export async function findAttenderById(id: number) {
  const result = await db
    .select(ATTENDER_COLUMNS)
    .from(attenders)
    .where(eq(attenders.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function findAttenderByUserId(
  userId: number
): Promise<{ id: number; isMember: boolean } | null> {
  const result = await db
    .select({ id: attenders.id, isMember: attenders.isMember })
    .from(attenders)
    .where(eq(attenders.userId, userId))
    .limit(1);

  return result[0] ?? null;
}

export async function insertAttender(
  data: Omit<typeof attenders.$inferInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'>
) {
  const result = await db
    .insert(attenders)
    .values({ ...data, status: 'ativo' })
    .returning(ATTENDER_COLUMNS);

  return result[0] ?? null;
}

export async function updateAttender(
  id: number,
  data: Partial<Omit<typeof attenders.$inferInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'>>
) {
  const result = await db
    .update(attenders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(attenders.id, id))
    .returning(ATTENDER_COLUMNS);

  return result[0] ?? null;
}

export async function deactivateAttender(id: number) {
  await db
    .update(attenders)
    .set({
      status: 'inativo',
      updatedAt: new Date()
    })
    .where(eq(attenders.id, id));
}
