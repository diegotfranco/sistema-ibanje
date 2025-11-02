import { z } from 'zod';

export const UserEntity = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.email(),
  password_hash: z.string().min(1),
  role_id: z.number().int().nullable()
});

export type UserEntity = z.infer<typeof UserEntity>;
export type UserSafeEntity = Omit<UserEntity, 'hash'>;
