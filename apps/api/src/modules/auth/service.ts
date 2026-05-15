import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { env } from '../../config/env.js';
import * as repo from './repository.js';
import { findAttenderByUserId } from '../attenders/repository.js';
import { listIncomeEntriesByAttender } from '../finance/income/entries/service.js';
import { updateAttenderProfile } from '../attenders/service.js';
import type { UpdateMyProfileRequest } from './schema.js';
import { httpError, isUniqueViolation } from '../../lib/errors.js';
import { sendPasswordResetEmail } from '../../lib/email.js';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { DEFAULT_ROLE_NAME } from '../../lib/constants.js';
import type { MeResponse } from './schema.js';

export async function login(email: string, password: string) {
  const user = await repo.findUserByEmail(email);

  if (!user?.passwordHash || user?.status !== ActiveStatus.Active) return null;

  const valid = await argon2.verify(user.passwordHash, password + env.ARGON2_PEPPER);
  if (!valid) return null;

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.roleName
  };
}

export async function getMe(userId: number): Promise<MeResponse | null> {
  const user = await repo.findUserById(userId);
  if (!user) return null;

  const [permissions, attenderLink] = await Promise.all([
    repo.findUserPermissions(userId),
    findAttenderByUserId(userId)
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roleName,
    status: user.status,
    permissions,
    attenderId: attenderLink?.id ?? null,
    isMember: attenderLink?.isMember ?? false
  };
}

export async function requestPasswordReset(email: string, ipAddress?: string, userAgent?: string) {
  const user = await repo.findUserByEmail(email);
  // Always returns without error to prevent user enumeration
  if (!user) return;

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await repo.createPasswordResetToken({
    userId: user.id,
    email,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent
  });

  await sendPasswordResetEmail(email, rawToken);
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await repo.findValidPasswordResetToken(tokenHash);

  if (!record || record.userId === null) return false;

  const passwordHash = await argon2.hash(newPassword + env.ARGON2_PEPPER, {
    type: argon2.argon2id
  });

  await repo.updateUserPasswordHash(record.userId, passwordHash);
  await repo.markPasswordResetTokenUsed(record.id);

  return true;
}

export async function listMyDonations(callerId: number, page: number, limit: number) {
  const link = await findAttenderByUserId(callerId);
  if (!link) throw httpError(404, 'No attender linked to this user');

  return listIncomeEntriesByAttender(callerId, link.id, page, limit, { isSelfAccess: true });
}

export async function updateMyProfile(callerId: number, body: UpdateMyProfileRequest) {
  const link = await findAttenderByUserId(callerId);
  if (!link) throw httpError(404, 'No attender linked to this user');

  const updated = await updateAttenderProfile(link.id, body);
  return { attenderId: link.id, profile: updated };
}

export async function register(name: string, email: string) {
  const membroRole = await repo.findRoleByName(DEFAULT_ROLE_NAME);
  if (!membroRole) throw new Error(`${DEFAULT_ROLE_NAME} role not found`);
  try {
    await repo.createPendingUser({ name, email, roleId: membroRole.id });
  } catch (err) {
    if (isUniqueViolation(err, 'users_email_unique')) {
      throw httpError(409, 'E-mail já cadastrado', {
        fieldErrors: { email: 'E-mail já cadastrado' }
      });
    }
    throw err;
  }
}
