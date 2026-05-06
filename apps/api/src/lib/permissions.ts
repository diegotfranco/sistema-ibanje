import { db } from '../db/index.js';
import { userModulePermissions, modules, permissions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { httpError } from './errors.js';
import { ModuleName, ActionName } from './constants.js';

export async function hasPermission(
  userId: number,
  moduleName: ModuleName,
  permissionName: ActionName
): Promise<boolean> {
  const result = await db
    .select({ id: userModulePermissions.userId })
    .from(userModulePermissions)
    .innerJoin(modules, eq(modules.id, userModulePermissions.moduleId))
    .innerJoin(permissions, eq(permissions.id, userModulePermissions.permissionId))
    .where(
      and(
        eq(userModulePermissions.userId, userId),
        eq(modules.name, moduleName),
        eq(permissions.name, permissionName)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function assertPermission(
  userId: number,
  moduleName: ModuleName,
  permissionName: ActionName
) {
  const allowed = await hasPermission(userId, moduleName, permissionName);
  if (!allowed) throw httpError(403, 'Forbidden');
}
