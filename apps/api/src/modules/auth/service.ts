import * as argon2 from 'argon2'
import { randomBytes, createHash } from 'node:crypto'
import { env } from '../../config/env'
import * as repo from './repository'
import type { MeResponse } from './schema'

export async function login(email: string, password: string) {
  const user = await repo.findUserByEmail(email)

  if (!user || !user.passwordHash || user.status !== 'ativo') return null

  const valid = await argon2.verify(user.passwordHash, password + env.ARGON2_PEPPER)
  if (!valid) return null

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.roleName,
  }
}

export async function getMe(userId: number): Promise<MeResponse | null> {
  const user = await repo.findUserById(userId)
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roleName,
    status: user.status,
  }
}

export async function requestPasswordReset(
  email: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await repo.findUserByEmail(email)
  // Always returns without error to prevent user enumeration
  if (!user) return

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await repo.createPasswordResetToken({
    userId: user.id,
    email,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
  })

  // TODO: send email with rawToken as the reset link parameter
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const record = await repo.findValidPasswordResetToken(tokenHash)

  if (!record || record.userId === null) return false

  const passwordHash = await argon2.hash(newPassword + env.ARGON2_PEPPER, {
    type: argon2.argon2id,
  })

  await repo.updateUserPasswordHash(record.userId, passwordHash)
  await repo.markPasswordResetTokenUsed(record.id)

  return true
}
