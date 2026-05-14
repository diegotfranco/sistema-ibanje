import { z } from 'zod';

export type { MeResponse } from '@sistema-ibanje/shared';

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false)
});

export const PasswordResetRequestSchema = z.object({
  email: z.email()
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8)
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(1).max(96),
  email: z.email()
});

export const CsrfTokenResponseSchema = z.object({
  csrfToken: z.string()
});

export const LoginResponseSchema = z.object({
  name: z.string(),
  email: z.string(),
  role: z.string()
});

export const MessageResponseSchema = z.object({
  message: z.string()
});

export const MeResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
  permissions: z.record(z.string(), z.number())
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
