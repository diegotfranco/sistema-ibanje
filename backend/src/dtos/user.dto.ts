import { z } from 'zod';

export const userCreateDTO = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  role_id: z.number().int().optional()
});

export type UserCreateDTO = z.infer<typeof userCreateDTO>;

export const userUpdateDTO = userCreateDTO.omit({ password: true }).partial();

export type UserUpdateDTO = z.infer<typeof userUpdateDTO>;
