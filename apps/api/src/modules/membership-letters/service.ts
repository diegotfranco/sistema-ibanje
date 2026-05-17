import * as repo from './repository.js';
import { renderLetter } from './templates.js';
import { assertPermission } from '../../lib/permissions.js';
import { Module, Action } from '../../lib/constants.js';
import { httpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import type {
  CreateMembershipLetterRequest,
  UpdateMembershipLetterRequest,
  MembershipLetterResponse
} from './schema.js';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { attenders, churchSettings } from '../../db/schema.js';

export async function listMembershipLetters(
  callerId: number,
  page: number,
  limit: number,
  attenderId?: number,
  type?: string
) {
  await assertPermission(callerId, Module.MembershipLetters, Action.View);

  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listMembershipLetters(offset, limit, attenderId, type);

  return paginate(
    rows.map(
      (row): MembershipLetterResponse => ({
        id: row.id,
        attenderId: row.attenderId,
        type: row.type,
        letterDate: row.letterDate,
        otherChurchName: row.otherChurchName,
        otherChurchAddress: row.otherChurchAddress,
        otherChurchCity: row.otherChurchCity,
        otherChurchState: row.otherChurchState,
        signingSecretaryName: row.signingSecretaryName,
        signingSecretaryTitle: row.signingSecretaryTitle,
        signingPresidentName: row.signingPresidentName,
        signingPresidentTitle: row.signingPresidentTitle,
        additionalContext: row.additionalContext,
        createdByUserId: row.createdByUserId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    ),
    total,
    page,
    limit
  );
}

export async function getMembershipLetterById(
  id: number
): Promise<MembershipLetterResponse | null> {
  const letter = await repo.findMembershipLetterById(id);
  if (!letter) return null;

  return {
    id: letter.id,
    attenderId: letter.attenderId,
    type: letter.type,
    letterDate: letter.letterDate,
    otherChurchName: letter.otherChurchName,
    otherChurchAddress: letter.otherChurchAddress,
    otherChurchCity: letter.otherChurchCity,
    otherChurchState: letter.otherChurchState,
    signingSecretaryName: letter.signingSecretaryName,
    signingSecretaryTitle: letter.signingSecretaryTitle,
    signingPresidentName: letter.signingPresidentName,
    signingPresidentTitle: letter.signingPresidentTitle,
    additionalContext: letter.additionalContext,
    createdByUserId: letter.createdByUserId,
    createdAt: letter.createdAt,
    updatedAt: letter.updatedAt
  };
}

export async function createMembershipLetter(
  callerId: number,
  body: CreateMembershipLetterRequest
): Promise<MembershipLetterResponse> {
  await assertPermission(callerId, Module.MembershipLetters, Action.Create);

  // Validate attender exists
  const attender = await db
    .select({ id: attenders.id })
    .from(attenders)
    .where(eq(attenders.id, body.attenderId))
    .limit(1);

  if (!attender[0]) {
    throw httpError(404, 'Attender not found');
  }

  // Load church settings singleton
  const settings = await db.select().from(churchSettings).where(eq(churchSettings.id, 1)).limit(1);

  const churchSetting = settings[0];
  if (!churchSetting) {
    throw httpError(409, 'Church settings not found');
  }

  if (!churchSetting.currentSecretaryName || !churchSetting.currentPresidentName) {
    throw httpError(
      409,
      'Church settings must have a current secretary and president before letters can be created'
    );
  }

  const created = await repo.insertMembershipLetter({
    attenderId: body.attenderId,
    type: body.type,
    letterDate: body.letterDate,
    otherChurchName: body.otherChurchName,
    otherChurchAddress: body.otherChurchAddress,
    otherChurchCity: body.otherChurchCity,
    otherChurchState: body.otherChurchState,
    signingSecretaryName: churchSetting.currentSecretaryName,
    signingSecretaryTitle: churchSetting.currentSecretaryTitle || '1º Secretário(a)',
    signingPresidentName: churchSetting.currentPresidentName,
    signingPresidentTitle: churchSetting.currentPresidentTitle || 'Presidente',
    additionalContext: body.additionalContext,
    createdByUserId: callerId
  });

  if (!created) {
    throw new Error('Failed to create membership letter');
  }

  return {
    id: created.id,
    attenderId: created.attenderId,
    type: created.type,
    letterDate: created.letterDate,
    otherChurchName: created.otherChurchName,
    otherChurchAddress: created.otherChurchAddress,
    otherChurchCity: created.otherChurchCity,
    otherChurchState: created.otherChurchState,
    signingSecretaryName: created.signingSecretaryName,
    signingSecretaryTitle: created.signingSecretaryTitle,
    signingPresidentName: created.signingPresidentName,
    signingPresidentTitle: created.signingPresidentTitle,
    additionalContext: created.additionalContext,
    createdByUserId: created.createdByUserId,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  };
}

export async function updateMembershipLetter(
  callerId: number,
  targetId: number,
  body: UpdateMembershipLetterRequest
): Promise<MembershipLetterResponse | null> {
  await assertPermission(callerId, Module.MembershipLetters, Action.Update);

  const letter = await repo.findMembershipLetterById(targetId);
  if (!letter) return null;

  const updated = await repo.updateMembershipLetter(targetId, {
    letterDate: body.letterDate,
    otherChurchName: body.otherChurchName,
    otherChurchAddress: body.otherChurchAddress,
    otherChurchCity: body.otherChurchCity,
    otherChurchState: body.otherChurchState,
    additionalContext: body.additionalContext
  });

  if (!updated) return null;

  return {
    id: updated.id,
    attenderId: updated.attenderId,
    type: updated.type,
    letterDate: updated.letterDate,
    otherChurchName: updated.otherChurchName,
    otherChurchAddress: updated.otherChurchAddress,
    otherChurchCity: updated.otherChurchCity,
    otherChurchState: updated.otherChurchState,
    signingSecretaryName: updated.signingSecretaryName,
    signingSecretaryTitle: updated.signingSecretaryTitle,
    signingPresidentName: updated.signingPresidentName,
    signingPresidentTitle: updated.signingPresidentTitle,
    additionalContext: updated.additionalContext,
    createdByUserId: updated.createdByUserId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}

export async function deleteMembershipLetter(
  callerId: number,
  targetId: number
): Promise<void | null> {
  await assertPermission(callerId, Module.MembershipLetters, Action.Delete);

  const letter = await repo.findMembershipLetterById(targetId);
  if (!letter) return null;

  await repo.deleteMembershipLetter(targetId);
}

export async function renderMembershipLetter(callerId: number, letterId: number): Promise<string> {
  await assertPermission(callerId, Module.MembershipLetters, Action.View);

  const letter = await repo.findMembershipLetterById(letterId);
  if (!letter) {
    throw httpError(404, 'Membership letter not found');
  }

  const attenderResult = await db
    .select()
    .from(attenders)
    .where(eq(attenders.id, letter.attenderId))
    .limit(1);

  if (!attenderResult[0]) {
    throw httpError(404, 'Attender not found');
  }

  const settingsResult = await db
    .select()
    .from(churchSettings)
    .where(eq(churchSettings.id, 1))
    .limit(1);

  const settings = settingsResult[0];
  if (!settings) {
    throw httpError(409, 'Church settings not found');
  }

  return renderLetter(letter, attenderResult[0], settings);
}
