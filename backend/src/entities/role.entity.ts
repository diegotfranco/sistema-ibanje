import { z } from 'zod';

export const RoleEntity = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable()
});

export type RoleEntity = z.infer<typeof RoleEntity>;
