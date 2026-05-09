import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

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

export const RoleResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  createdAt: z.date()
});

export const RoleListResponseSchema = paginatedSchema(RoleResponseSchema);

export const RolePermissionResponseSchema = z.object({
  moduleId: z.number().int().positive(),
  moduleName: z.string(),
  permissionId: z.number().int().positive(),
  permissionName: z.string()
});

export const RolePermissionListResponseSchema = z.array(RolePermissionResponseSchema);

export const ModuleResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable()
});

export const ModuleListResponseSchema = z.array(ModuleResponseSchema);

export const PermissionTypeResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable()
});

export const PermissionTypeListResponseSchema = z.array(PermissionTypeResponseSchema);

export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;
export type SetRolePermissionsRequest = z.infer<typeof SetRolePermissionsRequestSchema>;
export type RoleResponse = z.infer<typeof RoleResponseSchema>;
export type RolePermissionResponse = z.infer<typeof RolePermissionResponseSchema>;
