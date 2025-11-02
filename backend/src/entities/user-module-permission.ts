import { z } from 'zod';

export const UserModulePermissionEntity = z.object({
  module_id: z.number().int().positive(),
  permission_id: z.number().int().positive()
});

export type UserRolePermissionEntity = z.infer<typeof UserModulePermissionEntity>;
