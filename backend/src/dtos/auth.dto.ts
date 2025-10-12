import { z } from 'zod';

export const authLoginDTO = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export type AuthLoginDTO = z.infer<typeof authLoginDTO>;