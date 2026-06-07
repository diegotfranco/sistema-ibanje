import { eq, count, and, sql, type SQL } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { attenders } from '../../db/schema.js';
import { notDeleted } from '../../lib/softDelete.js';
import type { AttenderFilters } from './schema.js';

const ATTENDER_COLUMNS = {
  id: attenders.id,
  userId: attenders.userId,
  name: attenders.name,
  birthDate: attenders.birthDate,
  baptismDate: attenders.baptismDate,
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
  exitDate: attenders.exitDate,
  exitReason: attenders.exitReason,
  exitLetterId: attenders.exitLetterId,
  isMember: attenders.isMember,
  memberSince: attenders.memberSince,
  congregatingSince: attenders.congregatingSince,
  admissionMode: attenders.admissionMode,
  createdAt: attenders.createdAt,
  updatedAt: attenders.updatedAt
};

// Diacritic/case-insensitive name match. Mirrors the categories search; relies on
// the `unaccent` extension (migration 0003).
function attenderNameFilter(q: string): SQL {
  const pattern = `%${q}%`;
  return sql`unaccent(lower(${attenders.name})) LIKE unaccent(lower(${pattern}))`;
}

function attenderWhere(filters?: AttenderFilters): SQL | undefined {
  const conditions: SQL[] = [notDeleted(attenders)];
  if (filters?.isMember !== undefined) conditions.push(eq(attenders.isMember, filters.isMember));
  if (filters?.status !== undefined) conditions.push(eq(attenders.status, filters.status));
  if (filters?.q) conditions.push(attenderNameFilter(filters.q));
  return and(...conditions);
}

export async function listAttenders(offset: number, limit: number, filters?: AttenderFilters) {
  const where = attenderWhere(filters);
  const rows = await db
    .select(ATTENDER_COLUMNS)
    .from(attenders)
    .where(where)
    .orderBy(attenders.name)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(attenders).where(where);

  const total = countResult[0]?.count ?? 0;

  return { rows, total };
}

// Whole filtered roster (no pagination), name-ordered — backs the PDF export.
export async function listAttendersForExport(filters?: AttenderFilters) {
  return db
    .select(ATTENDER_COLUMNS)
    .from(attenders)
    .where(attenderWhere(filters))
    .orderBy(attenders.name);
}

export async function findAttenderById(id: number) {
  const result = await db
    .select(ATTENDER_COLUMNS)
    .from(attenders)
    .where(and(eq(attenders.id, id), notDeleted(attenders)))
    .limit(1);

  return result[0] ?? null;
}

export async function findAttenderByUserId(
  userId: number
): Promise<{ id: number; isMember: boolean } | null> {
  const result = await db
    .select({ id: attenders.id, isMember: attenders.isMember })
    .from(attenders)
    .where(and(eq(attenders.userId, userId), notDeleted(attenders)))
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

export async function updateAttenderStatus(
  id: number,
  data: Pick<typeof attenders.$inferInsert, 'status' | 'exitDate' | 'exitReason' | 'exitLetterId'>
) {
  const result = await db
    .update(attenders)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(attenders.id, id), notDeleted(attenders)))
    .returning(ATTENDER_COLUMNS);

  return result[0] ?? null;
}

export async function softDeleteAttender(id: number) {
  await db
    .update(attenders)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(and(eq(attenders.id, id), notDeleted(attenders)));
}
