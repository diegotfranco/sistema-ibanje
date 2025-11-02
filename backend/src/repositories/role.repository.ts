import { sql } from '@/db/postgres';
import { RoleEntity } from '@/entities/role.entity.js';

export const roleRepository = {
  async findById(id: number): Promise<RoleEntity | null> {
    const [role] = await sql<RoleEntity[]>`
      SELECT id, name, description
      FROM roles
      WHERE id = ${id} AND status = 'ativo'
    `;
    return role ?? null;
  }
};

export type RoleRepository = typeof roleRepository;
