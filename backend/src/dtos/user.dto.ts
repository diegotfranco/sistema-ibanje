import { z } from 'zod';

export const UserCreateDTO = z.object({
  nome: z.string().min(1, 'O nome é obrigatório'),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  id_cargo: z.number().int()
});

export type UserCreateDTO = z.infer<typeof UserCreateDTO>;

export const UserUpdateDTO = UserCreateDTO.partial();

export type UserUpdateDTO = z.infer<typeof UserUpdateDTO>;
