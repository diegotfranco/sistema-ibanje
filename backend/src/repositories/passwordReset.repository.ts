// src/repositories/passwordReset.repository.ts
import { sql } from '@/db/postgres';
import type { PasswordResetTokenEntity } from '@/entities/password-reset-token.entity';

export const passwordResetRepository = {
  async insert({
    userId,
    email,
    tokenHash,
    expiresAt,
    ip,
    userAgent
  }: {
    userId: number | null;
    email: string;
    tokenHash: string;
    expiresAt: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<PasswordResetTokenEntity> {
    const [row] = await sql<PasswordResetTokenEntity[]>`
      INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at, ip_address, user_agent)
      VALUES (${userId}, ${email}, ${tokenHash}, ${expiresAt}, ${ip ?? null}, ${userAgent ?? null})
      RETURNING *;
    `;
    return row;
  },

  async findValidByHash(tokenHash: string): Promise<PasswordResetTokenEntity | null> {
    const [row] = await sql<PasswordResetTokenEntity[]>`
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
        AND used_at IS NULL
        AND expires_at > now()
      LIMIT 1;
    `;
    return row ?? null;
  },

  async markUsed(id: number): Promise<void> {
    await sql`
      UPDATE password_reset_tokens
      SET used_at = now()
      WHERE id = ${id};
    `;
  },

  async countRecentByEmail(email: string, windowSeconds: number): Promise<number> {
    const [row] = await sql<{ cnt: number }[]>`
    SELECT count(*)::int AS cnt
    FROM password_reset_tokens
    WHERE email = ${email}
      AND created_at >= now() - make_interval(secs => ${windowSeconds});
  `;
    return row?.cnt ?? 0;
  }
};
