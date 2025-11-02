import { z } from 'zod';

export const PermissionEntity = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable()
});

export type PermissionEntity = z.infer<typeof PermissionEntity>;
