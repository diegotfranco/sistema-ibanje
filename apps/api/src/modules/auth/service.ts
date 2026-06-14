import * as argon2 from 'argon2';
import type { FastifyBaseLogger } from 'fastify';
import { randomBytes, createHash } from 'node:crypto';
import { env } from '../../config/env.js';
import * as repo from './repository.js';
import { findAttenderByUserId } from '../attenders/repository.js';
import { updateAttenderProfile } from '../attenders/service.js';
import type { UpdateMyProfileRequest } from './schema.js';
import { httpError, isUniqueViolation } from '../../lib/errors.js';
import { isCommonPassword } from '../../lib/passwordPolicy.js';
import { sendPasswordResetEmail } from '../../lib/email.js';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { DEFAULT_ROLE_NAME } from '../../lib/constants.js';
import type { MeResponse } from './schema.js';

// A well-formed argon2id hash, computed once and verified against on the user-not-found / no-hash
// path. Without it, skipping argon2.verify when the account doesn't exist makes that path return
// noticeably faster, leaking account existence by timing (and undercutting the generic error
// message). The pepper is included so the work factor matches a real verify exactly.
let dummyHashPromise: Promise<string> | null = null;
function dummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = argon2.hash('timing-equalizer-placeholder' + env.ARGON2_PEPPER, {
      type: argon2.argon2id
    });
  }
  return dummyHashPromise;
}

export async function login(email: string, password: string) {
  const user = await repo.findUserByEmail(email);

  // Always run exactly one argon2 verify — against the user's hash if present, otherwise a dummy —
  // so the response time is uniform regardless of whether the account exists or is active.
  const hash = user?.passwordHash ?? (await dummyHash());
  const valid = await argon2.verify(hash, password + env.ARGON2_PEPPER);

  if (!user?.passwordHash || user.status !== ActiveStatus.Active || !valid) return null;

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

export async function requestPasswordReset(
  email: string,
  ipAddress?: string,
  userAgent?: string,
  logger?: FastifyBaseLogger
) {
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

  // Unlike the admin invite path, a failure here must NOT surface to the caller: the endpoint
  // returns a uniform "if that email exists…" response, so throwing would leak account existence by
  // status code. Log it (structured, no PII beyond the internal userId) and stay silent.
  try {
    await sendPasswordResetEmail(email, rawToken);
  } catch (err) {
    logger?.error({ err, userId: user.id }, 'password reset email failed');
  }
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await repo.findValidPasswordResetToken(tokenHash);

  if (!record || record.userId === null) return false;

  // Reject breached/common passwords (length is already enforced by the Zod schema). Checked after
  // the token is validated but before it is consumed, so a weak choice gives a field error without
  // burning the token; an invalid token still returns the generic failure with no password feedback.
  if (await isCommonPassword(newPassword)) {
    throw httpError(400, 'Senha muito comum. Escolha uma senha mais forte.', {
      fieldErrors: { newPassword: 'Senha muito comum. Escolha uma senha mais forte.' }
    });
  }

  const passwordHash = await argon2.hash(newPassword + env.ARGON2_PEPPER, {
    type: argon2.argon2id
  });

  await repo.updateUserPasswordHash(record.userId, passwordHash);
  await repo.markPasswordResetTokenUsed(record.id);

  return true;
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
