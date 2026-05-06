import { eq, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { members } from '../../db/schema.js';

export async function listMembers(offset: number, limit: number) {
  const rows = await db
    .select({
      id: members.id,
      userId: members.userId,
      name: members.name,
      birthDate: members.birthDate,
      addressStreet: members.addressStreet,
      addressNumber: members.addressNumber,
      addressComplement: members.addressComplement,
      addressDistrict: members.addressDistrict,
      state: members.state,
      city: members.city,
      postalCode: members.postalCode,
      email: members.email,
      phone: members.phone,
      status: members.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt
    })
    .from(members)
    .orderBy(members.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(members);

  const total = countResult[0]?.count ?? 0;

  return { rows, total };
}

export async function findMemberById(id: number) {
  const result = await db
    .select({
      id: members.id,
      userId: members.userId,
      name: members.name,
      birthDate: members.birthDate,
      addressStreet: members.addressStreet,
      addressNumber: members.addressNumber,
      addressComplement: members.addressComplement,
      addressDistrict: members.addressDistrict,
      state: members.state,
      city: members.city,
      postalCode: members.postalCode,
      email: members.email,
      phone: members.phone,
      status: members.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt
    })
    .from(members)
    .where(eq(members.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function insertMember(
  data: Omit<typeof members.$inferInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'>
) {
  const result = await db
    .insert(members)
    .values({
      ...data,
      status: 'ativo'
    })
    .returning({
      id: members.id,
      userId: members.userId,
      name: members.name,
      birthDate: members.birthDate,
      addressStreet: members.addressStreet,
      addressNumber: members.addressNumber,
      addressComplement: members.addressComplement,
      addressDistrict: members.addressDistrict,
      state: members.state,
      city: members.city,
      postalCode: members.postalCode,
      email: members.email,
      phone: members.phone,
      status: members.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt
    });

  return result[0] ?? null;
}

export async function updateMember(
  id: number,
  data: Partial<Omit<typeof members.$inferInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'>>
) {
  const result = await db
    .update(members)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(members.id, id))
    .returning({
      id: members.id,
      userId: members.userId,
      name: members.name,
      birthDate: members.birthDate,
      addressStreet: members.addressStreet,
      addressNumber: members.addressNumber,
      addressComplement: members.addressComplement,
      addressDistrict: members.addressDistrict,
      state: members.state,
      city: members.city,
      postalCode: members.postalCode,
      email: members.email,
      phone: members.phone,
      status: members.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt
    });

  return result[0] ?? null;
}

export async function deactivateMember(id: number) {
  await db
    .update(members)
    .set({
      status: 'inativo',
      updatedAt: new Date()
    })
    .where(eq(members.id, id));
}
