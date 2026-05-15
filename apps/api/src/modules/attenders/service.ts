import * as repo from './repository.js';
import * as incomeEntriesService from '../finance/income/entries/service.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import type { CreateAttenderRequest, UpdateAttenderRequest, AttenderResponse } from './schema.js';
import type { UpdateMyProfileRequest } from '../auth/schema.js';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { users, attenders } from '../../db/schema.js';

export async function listAttenders(callerId: number, page: number, limit: number) {
  await assertPermission(callerId, Module.Members, Action.View);

  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listAttenders(offset, limit);

  return paginate(
    rows.map(
      (row): AttenderResponse => ({
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
        isMember: row.isMember,
        memberSince: row.memberSince,
        congregatingSinceYear: row.congregatingSinceYear,
        admissionMode: row.admissionMode,
        createdAt: row.createdAt
      })
    ),
    total,
    page,
    limit
  );
}

export async function getAttenderById(id: number): Promise<AttenderResponse | null> {
  const attender = await repo.findAttenderById(id);
  if (!attender) return null;

  return {
    id: attender.id,
    userId: attender.userId,
    name: attender.name,
    birthDate: attender.birthDate,
    addressStreet: attender.addressStreet,
    addressNumber: attender.addressNumber,
    addressComplement: attender.addressComplement,
    addressDistrict: attender.addressDistrict,
    state: attender.state,
    city: attender.city,
    postalCode: attender.postalCode,
    email: attender.email,
    phone: attender.phone,
    status: attender.status,
    isMember: attender.isMember,
    memberSince: attender.memberSince,
    congregatingSinceYear: attender.congregatingSinceYear,
    admissionMode: attender.admissionMode,
    createdAt: attender.createdAt
  };
}

export async function createAttender(
  callerId: number,
  body: CreateAttenderRequest
): Promise<AttenderResponse> {
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

    const existingAttender = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(eq(attenders.userId, body.userId))
      .limit(1);

    if (existingAttender[0]) {
      throw httpError(409, 'User is already linked to another attender', {
        fieldErrors: { userId: 'Usuário já possui frequentista vinculado' }
      });
    }
  }

  const created = await repo.insertAttender({
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
    phone: body.phone,
    isMember: body.isMember,
    memberSince: body.memberSince,
    congregatingSinceYear: body.congregatingSinceYear,
    admissionMode: body.admissionMode
  });

  if (!created) {
    throw new Error('Failed to create attender');
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
    isMember: created.isMember,
    memberSince: created.memberSince,
    congregatingSinceYear: created.congregatingSinceYear,
    admissionMode: created.admissionMode,
    createdAt: created.createdAt
  };
}

export async function updateAttender(
  callerId: number,
  targetId: number,
  body: UpdateAttenderRequest
): Promise<AttenderResponse | null> {
  await assertPermission(callerId, Module.Members, Action.Update);

  const attender = await repo.findAttenderById(targetId);
  if (!attender) return null;

  if (body.userId !== undefined) {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!user[0]) {
      throw httpError(404, 'User not found');
    }

    const existingAttender = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(eq(attenders.userId, body.userId))
      .limit(1);

    if (existingAttender[0] && existingAttender[0].id !== targetId) {
      throw httpError(409, 'User is already linked to another attender', {
        fieldErrors: { userId: 'Usuário já possui frequentista vinculado' }
      });
    }
  }

  const updated = await repo.updateAttender(targetId, body);
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
    isMember: updated.isMember,
    memberSince: updated.memberSince,
    congregatingSinceYear: updated.congregatingSinceYear,
    admissionMode: updated.admissionMode,
    createdAt: updated.createdAt
  };
}

export async function deactivateAttender(callerId: number, targetId: number): Promise<void | null> {
  await assertPermission(callerId, Module.Members, Action.Delete);

  const attender = await repo.findAttenderById(targetId);
  if (!attender) return null;

  await repo.deactivateAttender(targetId);
}

export async function listAttenderDonations(
  callerId: number,
  attenderId: number,
  page: number,
  limit: number
) {
  const attender = await repo.findAttenderById(attenderId);
  if (!attender) throw httpError(404, 'Attender not found');

  const link = await repo.findAttenderByUserId(callerId);
  const isSelfAccess = link?.id === attenderId;

  return incomeEntriesService.listIncomeEntriesByAttender(callerId, attenderId, page, limit, {
    isSelfAccess
  });
}

export async function updateAttenderProfile(
  attenderId: number,
  body: UpdateMyProfileRequest
): Promise<AttenderResponse | null> {
  const updated = await repo.updateAttender(attenderId, body);
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
    isMember: updated.isMember,
    memberSince: updated.memberSince,
    congregatingSinceYear: updated.congregatingSinceYear,
    admissionMode: updated.admissionMode,
    createdAt: updated.createdAt
  };
}
