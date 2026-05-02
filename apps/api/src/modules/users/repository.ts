import { eq, inArray, count } from 'drizzle-orm';
import { db } from '../../db';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
import {
  users,
  roles,
  userModulePermissions,
  modules,
  permissions,
  members,
  roleModulePermissions
} from '../../db/schema';

export async function listUsers(skip: number, take: number) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
      status: users.status,
      createdAt: users.createdAt
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .orderBy(users.id)
    .offset(skip)
    .limit(take);

  const countResult = await db.select({ count: count() }).from(users);

  const total = countResult[0]?.count ?? 0;

  return { rows, total };
}

export async function findUserById(id: number) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
      status: users.status,
      createdAt: users.createdAt
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function updateUser(
  id: number,
  data: Partial<Pick<typeof users.$inferInsert, 'name' | 'email' | 'roleId'>>
) {
  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(users.id, id));
}

export async function deactivateUser(id: number) {
  await db
    .update(users)
    .set({
      status: 'inativo',
      updatedAt: new Date()
    })
    .where(eq(users.id, id));
}

export async function findUserPasswordHash(id: number) {
  const result = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0]?.passwordHash ?? null;
}

export async function updateUserPasswordHash(id: number, passwordHash: string) {
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date()
    })
    .where(eq(users.id, id));
}

export async function getUserPermissions(userId: number) {
  const result = await db
    .select({
      moduleName: modules.name,
      permissionName: permissions.name
    })
    .from(userModulePermissions)
    .innerJoin(modules, eq(modules.id, userModulePermissions.moduleId))
    .innerJoin(permissions, eq(permissions.id, userModulePermissions.permissionId))
    .where(eq(userModulePermissions.userId, userId))
    .orderBy(modules.name, permissions.name);

  return result;
}

export async function setUserPermissions(
  userId: number,
  rows: Array<{ moduleId: number; permissionId: number }>
) {
  await db.transaction(async (tx) => {
    await tx.delete(userModulePermissions).where(eq(userModulePermissions.userId, userId));

    if (rows.length > 0) {
      await tx.insert(userModulePermissions).values(
        rows.map((row) => ({
          userId,
          moduleId: row.moduleId,
          permissionId: row.permissionId
        }))
      );
    }
  });
}

export async function resolvePermissionRows(permissionsMap: Record<string, string[]>) {
  const moduleNames = Object.keys(permissionsMap);
  const permissionNames = Array.from(new Set(Object.values(permissionsMap).flat()));

  const foundModules = await db
    .select({ id: modules.id, name: modules.name })
    .from(modules)
    .where(inArray(modules.name, moduleNames));

  const foundPermissions = await db
    .select({ id: permissions.id, name: permissions.name })
    .from(permissions)
    .where(inArray(permissions.name, permissionNames));

  const moduleMap = new Map(foundModules.map((m) => [m.name, m.id]));
  const permissionMap = new Map(foundPermissions.map((p) => [p.name, p.id]));

  const unknownModules = moduleNames.filter((n) => !moduleMap.has(n));
  const unknownPermissions = permissionNames.filter((n) => !permissionMap.has(n));

  const rows: Array<{ moduleId: number; permissionId: number }> = [];
  for (const [moduleName, permNames] of Object.entries(permissionsMap)) {
    const moduleId = moduleMap.get(moduleName);
    if (moduleId === undefined) continue;
    for (const permName of permNames) {
      const permissionId = permissionMap.get(permName);
      if (permissionId !== undefined) {
        rows.push({ moduleId, permissionId });
      }
    }
  }

  return { rows, unknownModules, unknownPermissions };
}

export async function findMemberById(id: number) {
  const result = await db
    .select({ id: members.id, userId: members.userId, name: members.name })
    .from(members)
    .where(eq(members.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function copyRolePermissionsToUser(roleId: number, userId: number, tx?: Tx) {
  const executor = tx ?? db;
  const rolePerms = await executor
    .select()
    .from(roleModulePermissions)
    .where(eq(roleModulePermissions.roleId, roleId));
  if (rolePerms.length > 0) {
    await executor.insert(userModulePermissions).values(
      rolePerms.map((rmp) => ({
        userId,
        moduleId: rmp.moduleId,
        permissionId: rmp.permissionId
      }))
    );
  }
}
