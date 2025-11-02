import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('E-mail inválido').max(96, 'O e-mail deve ter no máximo 96 caracteres'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(64, 'A senha deve ter no máximo 64 caracteres'),
  rememberMe: z.boolean()
});

export type LoginSchema = z.infer<typeof loginSchema>;
