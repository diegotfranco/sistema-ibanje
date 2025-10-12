import { sql } from '@/db/postgres';
import { UserRolePermissionEntity } from '@/entities/user-role-permission';

export const permissionRepository = {
  async findByUserId(userId: number): Promise<UserRolePermissionEntity[]> {
    return await sql<UserRolePermissionEntity[]>`
      SELECT id_area, id_permissao
      FROM usuarios_x_areas_x_permissoes
      WHERE id_usuario = ${userId}
    `;
  }
};

export type PermissionRepository = typeof permissionRepository;
