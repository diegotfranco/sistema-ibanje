import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  rememberMe: z.boolean()
});

export type LoginSchema = z.infer<typeof loginSchema>;
