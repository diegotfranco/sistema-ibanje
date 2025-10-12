import { z } from 'zod';

export const UserRolePermissionEntity = z.object({
  id_area: z.number().int().positive(),
  id_permissao: z.number().int().positive()
});

export type UserRolePermissionEntity = z.infer<typeof UserRolePermissionEntity>;
