import { z } from 'zod';

export const RoleEntity = z.object({
  id: z.number(),
  nome: z.string(),
  descricao: z.string().nullable()
});

export type RoleEntity = z.infer<typeof RoleEntity>;
