import { db } from '../db';
import { userModulePermissions, modules, permissions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function hasPermission(
  userId: number,
  moduleName: string,
  permissionName: string
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
