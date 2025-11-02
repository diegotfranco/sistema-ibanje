import { sql } from '@/db/postgres';
import { UserRolePermissionEntity } from '@/entities/user-module-permission';

export const permissionRepository = {
  async findByUserId(userId: number): Promise<UserRolePermissionEntity[]> {
    return await sql<UserRolePermissionEntity[]>`
      SELECT module_id, permission_id
      FROM user_module_permissions
      WHERE user_id = ${userId}
    `;
  }
};

export type PermissionRepository = typeof permissionRepository;
