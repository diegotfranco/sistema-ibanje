import { z } from 'zod';

export const ListRolesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateRoleRequestSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().max(256).optional()
});

export const UpdateRoleRequestSchema = CreateRoleRequestSchema.partial();

export const SetRolePermissionsRequestSchema = z.object({
  permissions: z.array(
    z.object({
      moduleId: z.number().int().positive(),
      permissionId: z.number().int().positive()
    })
  )
});

export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;
export type SetRolePermissionsRequest = z.infer<typeof SetRolePermissionsRequestSchema>;

export type RoleResponse = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

export type RolePermissionResponse = {
  moduleId: number;
  moduleName: string;
  permissionId: number;
  permissionName: string;
};
