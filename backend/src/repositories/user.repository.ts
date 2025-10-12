import { sql } from '@/db/postgres';
import type { UserEntity, UserSafeEntity } from '@/entities/user.entity';
import type { UserCreateDTO, UserUpdateDTO } from '@/dtos/user.dto';

export const userRepository = {
  async findAll(): Promise<UserSafeEntity[]> {
    return await sql<UserSafeEntity[]>`
      SELECT id, email, nome, id_cargo
      FROM usuarios
      WHERE id_status = 1
      ORDER BY id
    `;
  },

  async findById(id: number): Promise<UserSafeEntity | null> {
    const [user] = await sql<UserSafeEntity[]>`
      SELECT id, email, nome, id_cargo
      FROM usuarios
      WHERE id = ${id} AND id_status = 1
    `;
    return user ?? null;
  },

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [user] = await sql<UserEntity[]>`
      SELECT id, email, nome, hash, id_cargo
      FROM usuarios
      WHERE email = ${email} AND id_status = 1
    `;
    return user ?? null;
  },

  async create(data: UserCreateDTO & { hash: string }): Promise<UserEntity> {
    const [newUser] = await sql<UserEntity[]>`
      INSERT INTO usuarios (nome, email, hash, id_cargo, id_status)
      VALUES (${data.nome}, ${data.email}, ${data.hash}, ${data.id_cargo}, 1)
      RETURNING id, email, nome, hash, id_cargo
    `;
    return newUser;
  },

  async update(id: number, data: UserUpdateDTO & { hash?: string }): Promise<UserEntity | null> {
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) updates[key === 'password' ? 'hash' : key] = value;
    }

    if (!Object.keys(updates).length) return null;

    const [user] = await sql<UserEntity[]>`
    UPDATE usuarios
    SET ${sql(updates)}
    WHERE id = ${id}
    RETURNING id, email, nome, hash, id_cargo
  `;

    return user ?? null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      UPDATE usuarios SET id_status = 0 WHERE id = ${id}
    `;
    return result.count > 0;
  }
};

export type UserRepository = typeof userRepository;
