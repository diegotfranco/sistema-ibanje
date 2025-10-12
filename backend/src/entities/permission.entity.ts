import { z } from 'zod';

export const PermissionEntity = z.object({
  id: z.number(),
  nome: z.string(),
  descricao: z.string().nullable()
});

export type PermissionEntity = z.infer<typeof PermissionEntity>;
