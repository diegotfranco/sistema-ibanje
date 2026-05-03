import * as repo from './repository';
import { assertPermission } from '../../lib/permissions';
import { Module, Action } from '../../lib/constants';
import { httpError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import type { CreateMemberRequest, UpdateMemberRequest, MemberResponse } from './schema';
import { db } from '../../db/index';
import { eq } from 'drizzle-orm';
import { users, members } from '../../db/schema';

export async function listMembers(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.Members, Action.View);

  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listMembers(offset, limit);

  return paginate(
    rows.map(
      (row): MemberResponse => ({
        id: row.id,
        userId: row.userId,
        name: row.name,
        birthDate: row.birthDate,
        addressStreet: row.addressStreet,
        addressNumber: row.addressNumber,
        addressComplement: row.addressComplement,
        addressDistrict: row.addressDistrict,
        state: row.state,
        city: row.city,
        postalCode: row.postalCode,
        email: row.email,
        phone: row.phone,
        status: row.status,
        createdAt: row.createdAt
      })
    ),
    total,
    page,
    limit
  );
}

export async function getMemberById(id: number): Promise<MemberResponse | null> {
  const member = await repo.findMemberById(id);
  if (!member) return null;

  return {
    id: member.id,
    userId: member.userId,
    name: member.name,
    birthDate: member.birthDate,
    addressStreet: member.addressStreet,
    addressNumber: member.addressNumber,
    addressComplement: member.addressComplement,
    addressDistrict: member.addressDistrict,
    state: member.state,
    city: member.city,
    postalCode: member.postalCode,
    email: member.email,
    phone: member.phone,
    status: member.status,
    createdAt: member.createdAt
  };
}

export async function createMember(
  callerId: number,
  body: CreateMemberRequest
): Promise<MemberResponse> {
  await assertPermission(callerId, Module.Members, Action.Create);

  if (body.userId !== undefined) {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!user[0]) {
      throw httpError(404, 'User not found');
    }

    const existingMember = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, body.userId))
      .limit(1);

    if (existingMember[0]) {
      throw httpError(409, 'User is already linked to another member');
    }
  }

  const created = await repo.insertMember({
    userId: body.userId,
    name: body.name,
    birthDate: body.birthDate,
    addressStreet: body.addressStreet,
    addressNumber: body.addressNumber,
    addressComplement: body.addressComplement,
    addressDistrict: body.addressDistrict,
    state: body.state,
    city: body.city,
    postalCode: body.postalCode,
    email: body.email,
    phone: body.phone
  });

  if (!created) {
    throw new Error('Failed to create member');
  }

  return {
    id: created.id,
    userId: created.userId,
    name: created.name,
    birthDate: created.birthDate,
    addressStreet: created.addressStreet,
    addressNumber: created.addressNumber,
    addressComplement: created.addressComplement,
    addressDistrict: created.addressDistrict,
    state: created.state,
    city: created.city,
    postalCode: created.postalCode,
    email: created.email,
    phone: created.phone,
    status: created.status,
    createdAt: created.createdAt
  };
}

export async function updateMember(
  callerId: number,
  targetId: number,
  body: UpdateMemberRequest
): Promise<MemberResponse | null> {
  await assertPermission(callerId, Module.Members, Action.Update);

  const member = await repo.findMemberById(targetId);
  if (!member) return null;

  if (body.userId !== undefined) {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!user[0]) {
      throw httpError(404, 'User not found');
    }

    const existingMember = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, body.userId))
      .limit(1);

    if (existingMember[0] && existingMember[0].id !== targetId) {
      throw httpError(409, 'User is already linked to another member');
    }
  }

  const updated = await repo.updateMember(targetId, body);
  if (!updated) return null;

  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    birthDate: updated.birthDate,
    addressStreet: updated.addressStreet,
    addressNumber: updated.addressNumber,
    addressComplement: updated.addressComplement,
    addressDistrict: updated.addressDistrict,
    state: updated.state,
    city: updated.city,
    postalCode: updated.postalCode,
    email: updated.email,
    phone: updated.phone,
    status: updated.status,
    createdAt: updated.createdAt
  };
}

export async function deactivateMember(callerId: number, targetId: number): Promise<void | null> {
  await assertPermission(callerId, Module.Members, Action.Delete);

  const member = await repo.findMemberById(targetId);
  if (!member) return null;

  await repo.deactivateMember(targetId);
}
