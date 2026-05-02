import { z } from 'zod'

export const ListUsersRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const UpdateUserRequestSchema = z
  .object({
    name: z.string().min(1).max(96).optional(),
    email: z.email().optional(),
    roleId: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => data[key as keyof typeof data] !== undefined), {
    message: 'At least one field must be provided',
  })

export const UpdatePasswordRequestSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
})

export const UpdatePermissionsRequestSchema = z.object({
  permissions: z.record(z.string(), z.array(z.string())),
})

export const CreateUserRequestSchema = z.object({
  name: z.string().min(1).max(96),
  email: z.email(),
  roleId: z.number().int().positive(),
  memberId: z.number().int().positive().optional(),
})

export type ListUsersRequest = z.infer<typeof ListUsersRequestSchema>
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>
export type UpdatePermissionsRequest = z.infer<typeof UpdatePermissionsRequestSchema>
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>

export type UserResponse = {
  id: number
  name: string
  email: string
  role: string
  roleId: number
  status: string
  createdAt: Date
}
