import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListUsersRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const UpdateUserRequestSchema = z
  .object({
    name: z.string().min(1).max(96).optional(),
    email: z.email().optional(),
    roleId: z.number().int().positive().optional()
  })
  .refine((data) => Object.keys(data).some((key) => data[key as keyof typeof data] !== undefined), {
    message: 'At least one field must be provided'
  });

export const UpdatePasswordRequestSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8)
});

export const UpdatePermissionsRequestSchema = z.object({
  permissions: z.record(z.string(), z.array(z.string()))
});

export const CreateUserRequestSchema = z.object({
  name: z.string().min(1).max(96),
  email: z.email(),
  roleId: z.number().int().positive(),
  memberId: z.number().int().positive().optional()
});

export const UserResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  roleId: z.number().int().positive(),
  status: z.string(),
  createdAt: z.date()
});

export const UserListResponseSchema = paginatedSchema(UserResponseSchema);

export const UserPermissionsResponseSchema = z.record(z.string(), z.array(z.string()));

export type ListUsersRequest = z.infer<typeof ListUsersRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;
export type UpdatePermissionsRequest = z.infer<typeof UpdatePermissionsRequestSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
