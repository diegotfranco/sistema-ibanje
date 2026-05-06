import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, roles, passwordResetTokens, userModulePermissions } from '../../db/schema.js';

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

export async function findUserPermissions(userId: number): Promise<Record<number, number>> {
  const rows = await db
    .select({
      moduleId: userModulePermissions.moduleId,
      permissionId: userModulePermissions.permissionId
    })
    .from(userModulePermissions)
    .where(eq(userModulePermissions.userId, userId));

  const out: Record<number, number> = {};
  for (const r of rows) {
    out[r.moduleId] = (out[r.moduleId] ?? 0) | (1 << (r.permissionId - 1));
  }
  return out;
}
