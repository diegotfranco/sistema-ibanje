import { sql } from '@/db/postgres';
import { RoleEntity } from '@/entities/role.entity.js';

export const roleRepository = {
  async findById(id: number): Promise<RoleEntity | null> {
    const [role] = await sql<RoleEntity[]>`
      SELECT id, nome, descricao
      FROM cargos
      WHERE id = ${id} AND id_status = 1
    `;
    return role ?? null;
  }
};

export type RoleRepository = typeof roleRepository;
