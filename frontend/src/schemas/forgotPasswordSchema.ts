import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.email('E-mail inválido').max(96, 'O e-mail deve ter no máximo 96 caracteres')
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
