import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { env } from '../../config/env';
import { db } from '../../db';
import { passwordResetTokens, users, roles, members } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as repo from './repository';
import { assertPermission } from '../../lib/permissions';
import { Module, Action } from '../../lib/constants';
import { paginate } from '../../lib/pagination';
import type {
  UpdateUserRequest,
  UpdatePasswordRequest,
  UserResponse,
  CreateUserRequest
} from './schema';
import { httpError } from '../../lib/errors';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function listUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const { rows, total } = await repo.listUsers(offset, limit);

  return paginate(
    rows.map(
      (row): UserResponse => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.roleName,
        roleId: row.roleId,
        status: row.status,
        createdAt: row.createdAt
      })
    ),
    total,
    page,
    limit
  );
}

export async function getUserById(id: number): Promise<UserResponse | null> {
  const user = await repo.findUserById(id);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roleName,
    roleId: user.roleId,
    status: user.status,
    createdAt: user.createdAt
  };
}

export async function updateUser(callerId: number, targetId: number, body: UpdateUserRequest) {
  if (callerId === targetId) {
    if (body.roleId !== undefined) {
      throw httpError(403, 'Cannot change your own role');
    }
  } else {
    await assertPermission(callerId, Module.Users, Action.Update);
  }

  const user = await repo.findUserById(targetId);
  if (!user) return null;

  await repo.updateUser(targetId, body);
  return await getUserById(targetId);
}

export async function deactivateUser(callerId: number, targetId: number) {
  if (callerId === targetId) {
    throw httpError(400, 'Cannot deactivate your own account');
  }

  const user = await repo.findUserById(targetId);
  if (!user) return null;

  await repo.deactivateUser(targetId);
}

export async function changePassword(
  callerId: number,
  targetId: number,
  body: UpdatePasswordRequest
) {
  if (callerId === targetId) {
    if (!body.currentPassword) {
      throw httpError(400, 'currentPassword is required');
    }

    const passwordHash = await repo.findUserPasswordHash(targetId);
    if (!passwordHash) {
      throw httpError(400, 'Current password is incorrect');
    }

    const valid = await argon2.verify(passwordHash, body.currentPassword + env.ARGON2_PEPPER);
    if (!valid) {
      throw httpError(400, 'Current password is incorrect');
    }
  } else {
    await assertPermission(callerId, Module.Users, Action.Update);
  }

  const newPasswordHash = await argon2.hash(body.newPassword + env.ARGON2_PEPPER, {
    type: argon2.argon2id
  });

  await repo.updateUserPasswordHash(targetId, newPasswordHash);
}

export async function getUserPermissions(userId: number) {
  const perms = await repo.getUserPermissions(userId);

  const result: Record<string, string[]> = {};
  for (const perm of perms) {
    if (!result[perm.moduleName]) {
      result[perm.moduleName] = [];
    }
    result[perm.moduleName].push(perm.permissionName);
  }

  return result;
}

export async function setUserPermissions(
  callerId: number,
  targetId: number,
  permissionsMap: Record<string, string[]>
) {
  if (callerId === targetId) {
    throw httpError(403, 'Cannot modify your own permissions');
  }

  const { rows, unknownModules, unknownPermissions } =
    await repo.resolvePermissionRows(permissionsMap);

  const unknown = [...unknownModules, ...unknownPermissions];
  if (unknown.length > 0) {
    throw httpError(400, `Unknown module or permission: ${unknown.join(', ')}`);
  }

  await repo.setUserPermissions(targetId, rows);
}

async function generateInviteToken(tx: Tx, userId: number, email: string) {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await tx.insert(passwordResetTokens).values({ userId, email, tokenHash, expiresAt });
  return rawToken;
}

export async function createUser(
  body: CreateUserRequest,
  logFn: (token: string) => void
): Promise<UserResponse> {
  return await db.transaction(async (tx) => {
    if (body.memberId !== undefined) {
      const member = await repo.findMemberById(body.memberId);
      if (!member) {
        throw httpError(404, 'Member not found');
      }
      if (member.userId !== null) {
        throw httpError(409, 'Member already has a user account');
      }
    }

    const result = await tx
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        roleId: body.roleId,
        status: 'ativo'
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        status: users.status,
        createdAt: users.createdAt
      });

    const newUser = result[0];
    if (!newUser) throw new Error('Failed to create user');

    await repo.copyRolePermissionsToUser(body.roleId, newUser.id, tx);

    if (body.memberId !== undefined) {
      await tx.update(members).set({ userId: newUser.id }).where(eq(members.id, body.memberId));
    }

    const rawToken = await generateInviteToken(tx, newUser.id, body.email);
    logFn(rawToken);

    const roleResult = await tx
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, newUser.roleId))
      .limit(1);

    const roleName = roleResult[0]?.name ?? '';

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: roleName,
      roleId: newUser.roleId,
      status: newUser.status,
      createdAt: newUser.createdAt
    };
  });
}

export async function approveUser(
  targetId: number,
  logFn: (token: string, email: string) => void
): Promise<UserResponse | null> {
  return await db.transaction(async (tx) => {
    const userRecord = await tx.select().from(users).where(eq(users.id, targetId)).limit(1);

    const user = userRecord[0];
    if (!user) return null;

    if (user.status !== 'pendente') {
      throw httpError(400, 'User is not pending approval');
    }

    await tx
      .update(users)
      .set({ status: 'ativo', updatedAt: new Date() })
      .where(eq(users.id, targetId));

    await repo.copyRolePermissionsToUser(user.roleId, targetId, tx);

    const rawToken = await generateInviteToken(tx, targetId, user.email);
    logFn(rawToken, user.email);

    const roleResult = await tx
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    const roleName = roleResult[0]?.name ?? '';

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      roleId: user.roleId,
      status: 'ativo',
      createdAt: user.createdAt
    };
  });
}
