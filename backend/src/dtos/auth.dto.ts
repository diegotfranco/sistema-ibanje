import { z } from 'zod';

export const authLoginDTO = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres')
});

export type AuthLoginDTO = z.infer<typeof authLoginDTO>;

export const authSignUpDTO = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres')
});

export type AuthSignUpDTO = z.infer<typeof authSignUpDTO>;

export const authForgotPasswordDTO = z.object({
  email: z.email('Email inválido')
});

export type AuthForgotPasswordDTO = z.infer<typeof authForgotPasswordDTO>;

export const authResetPasswordDTO = z.object({
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  token: z.string()
});

export type AuthResetPasswordDTO = z.infer<typeof authResetPasswordDTO>;
