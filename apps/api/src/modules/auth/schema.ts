import { z } from 'zod'

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const PasswordResetRequestSchema = z.object({
  email: z.email(),
})

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

export const RegisterRequestSchema = z.object({
  name: z.string().min(1).max(96),
  email: z.email(),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

export type MeResponse = {
  id: number
  name: string
  email: string
  role: string
  status: string
}
