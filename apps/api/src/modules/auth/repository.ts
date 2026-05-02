import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { users, roles, passwordResetTokens } from '../../db/schema';

export async function findUserByEmail(email: string) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      passwordHash: users.passwordHash,
      roleId: users.roleId,
      roleName: roles.name,
      status: users.status
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email))
    .limit(1);

  return result[0] ?? null;
}

export async function findUserById(id: number) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      roleName: roles.name,
      status: users.status
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function createPasswordResetToken(data: {
  userId: number;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.insert(passwordResetTokens).values(data);
}

export async function findValidPasswordResetToken(tokenHash: string) {
  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

export async function markPasswordResetTokenUsed(id: number) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, id));
}

export async function updateUserPasswordHash(userId: number, passwordHash: string) {
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function findRoleByName(name: string) {
  const result = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
  return result[0] ?? null;
}

export async function createPendingUser(data: { name: string; email: string; roleId: number }) {
  const result = await db
    .insert(users)
    .values({ ...data, status: 'pendente' })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      roleId: users.roleId,
      status: users.status,
      createdAt: users.createdAt
    });
  return result[0];
}
