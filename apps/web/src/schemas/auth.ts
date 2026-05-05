import * as z from 'zod';

export const LoginSchema = z.object({
  email: z.email('E-mail inválido').max(96, 'O e-mail deve ter no máximo 96 caracteres'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(64, 'A senha deve ter no máximo 64 caracteres'),
  rememberMe: z.boolean()
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(96, 'O nome deve ter no máximo 96 caracteres'),
  email: z.email('E-mail inválido').max(96, 'O e-mail deve ter no máximo 96 caracteres')
});

export const ForgotPasswordSchema = z.object({
  email: z.email('E-mail inválido').max(96, 'O e-mail deve ter no máximo 96 caracteres')
});

export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .max(64, 'A senha deve ter no máximo 64 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type RegisterFormValues = z.infer<typeof RegisterSchema>;
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;
