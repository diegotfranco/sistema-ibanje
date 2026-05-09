import { eq, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { roles, modules, permissions, roleModulePermissions, users } from '../../db/schema.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function listRoles(offset: number, limit: number) {
  const rows = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      status: roles.status,
      createdAt: roles.createdAt
    })
    .from(roles)
    .orderBy(roles.id)
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(roles);
  const total = countResult[0]?.count ?? 0;

  return { rows, total };
}

export async function findRoleById(id: number) {
  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      status: roles.status,
      createdAt: roles.createdAt
    })
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function roleHasActiveUsers(roleId: number): Promise<boolean> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.roleId, roleId))
    .limit(1);

  return result.length > 0;
}

export async function insertRole(data: { name: string; description?: string }) {
  const result = await db.insert(roles).values(data).returning({
    id: roles.id,
    name: roles.name,
    description: roles.description,
    status: roles.status,
    createdAt: roles.createdAt
  });

  return result[0] ?? null;
}

export async function updateRole(
  id: number,
  data: Partial<Pick<typeof roles.$inferInsert, 'name' | 'description'>>
) {
  const result = await db
    .update(roles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(roles.id, id))
    .returning({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      status: roles.status,
      createdAt: roles.createdAt
    });

  return result[0] ?? null;
}

export async function deactivateRole(id: number) {
  await db.update(roles).set({ status: 'inativo', updatedAt: new Date() }).where(eq(roles.id, id));
}

export async function getRolePermissions(roleId: number) {
  return db
    .select({
      moduleId: modules.id,
      moduleName: modules.name,
      permissionId: permissions.id,
      permissionName: permissions.name
    })
    .from(roleModulePermissions)
    .innerJoin(modules, eq(roleModulePermissions.moduleId, modules.id))
    .innerJoin(permissions, eq(roleModulePermissions.permissionId, permissions.id))
    .where(eq(roleModulePermissions.roleId, roleId))
    .orderBy(modules.id, permissions.id);
}

export async function setRolePermissions(
  roleId: number,
  entries: { moduleId: number; permissionId: number }[],
  tx?: Tx
) {
  const executor = tx ?? db;
  await executor.delete(roleModulePermissions).where(eq(roleModulePermissions.roleId, roleId));

  if (entries.length > 0) {
    await executor
      .insert(roleModulePermissions)
      .values(entries.map((e) => ({ roleId, moduleId: e.moduleId, permissionId: e.permissionId })));
  }
}

export async function listModules() {
  return db
    .select({ id: modules.id, name: modules.name, description: modules.description })
    .from(modules)
    .where(eq(modules.status, 'ativo'))
    .orderBy(modules.id);
}

export async function listPermissionTypes() {
  return db
    .select({ id: permissions.id, name: permissions.name, description: permissions.description })
    .from(permissions)
    .where(eq(permissions.status, 'ativo'))
    .orderBy(permissions.id);
}
