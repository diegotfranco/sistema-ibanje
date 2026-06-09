import { z } from 'zod';
import { emailField, phoneField, cepField, ufField, trimmedString } from '../../lib/normalize.js';

export type { MeResponse } from '@sistema-ibanje/shared';

// Email is normalized to trimmed lowercase at the boundary so the exact-match lookup
// (`findUserByEmail` uses `eq`) matches the lowercase value stored at registration.
export const LoginRequestSchema = z.object({
  email: emailField,
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false)
});

export const PasswordResetRequestSchema = z.object({
  email: emailField
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8)
});

export const RegisterRequestSchema = z.object({
  name: trimmedString(96, 1),
  email: emailField
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
  permissions: z.record(z.string(), z.number()),
  attenderId: z.number().int().positive().nullable(),
  isMember: z.boolean()
});

// MePage converts blank inputs to `undefined` before submit, so these never receive `''`.
export const UpdateMyProfileRequestSchema = z
  .object({
    phone: phoneField.optional(),
    email: emailField.optional(),
    addressStreet: trimmedString(96).optional(),
    addressNumber: trimmedString(16).optional(),
    addressComplement: trimmedString(64).optional(),
    addressDistrict: trimmedString(64).optional(),
    state: ufField.optional(),
    city: trimmedString(96).optional(),
    postalCode: cepField.optional()
  })
  .strict();

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type UpdateMyProfileRequest = z.infer<typeof UpdateMyProfileRequestSchema>;
