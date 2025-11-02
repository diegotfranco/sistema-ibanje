import { sql } from '@/db/postgres';
import type { UserEntity, UserSafeEntity } from '@/entities/user.entity';
import type { UserCreateDTO, UserUpdateDTO } from '@/dtos/user.dto';

export const userRepository = {
  async findAll(): Promise<UserSafeEntity[]> {
    return sql<UserSafeEntity[]>`
      SELECT id, email, name, role_id
      FROM users
      WHERE status = 'ativo'
      ORDER BY id
    `;
  },

  async findById(id: number): Promise<UserSafeEntity | null> {
    const [user] = await sql<UserSafeEntity[]>`
      SELECT id, email, name, role_id
      FROM users
      WHERE id = ${id} AND status = 'ativo'
    `;
    return user ?? null;
  },

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [user] = await sql<UserEntity[]>`
      SELECT id, email, name, password_hash, role_id
      FROM users
      WHERE email = ${email} AND status = 'ativo'
    `;
    return user ?? null;
  },

  async create(
    data: Omit<UserCreateDTO, 'password'> & { password_hash: string },
    status?: 'ativo' | 'inativo' | 'pendente'
  ): Promise<UserEntity | null> {
    const newData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries({ ...data, status })) {
      if (value !== undefined) {
        newData[key] = value;
      }
    }

    if (!Object.keys(newData).length) return null;

    const [newUser] = await sql<UserEntity[]>`
    INSERT INTO users ${sql(newData)}
    RETURNING id, email, name, password_hash, role_id
    `;
    return newUser;
  },

  async update(id: number, data: UserUpdateDTO): Promise<UserEntity | null> {
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    if (!Object.keys(updates).length) return null;

    const [user] = await sql<UserEntity[]>`
    UPDATE users
    SET ${sql(updates)}
    WHERE id = ${id}
    RETURNING id, email, name, password_hash, role_id
  `;
    return user ?? null;
  },

  async updatePassword(id: number, password_hash: string): Promise<boolean> {
    const result = await sql`
      UPDATE users
      SET password_hash = ${password_hash}
      WHERE id = ${id}
    `;
    return result.count > 0;
  },

  async delete(id: number): Promise<boolean> {
    const result = await sql`
      UPDATE users
      SET status = 'inativo'
      WHERE id = ${id}
    `;
    return result.count > 0;
  }
};

export type UserRepository = typeof userRepository;
