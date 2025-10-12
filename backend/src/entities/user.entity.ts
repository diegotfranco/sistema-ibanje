import { z } from 'zod';

export const UserEntity = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1),
  email: z.email(),
  hash: z.string().min(1),
  id_cargo: z.number().int()
});

export type UserEntity = z.infer<typeof UserEntity>;
export type UserSafeEntity = Omit<UserEntity, 'hash'>;
