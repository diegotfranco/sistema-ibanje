import { z } from 'zod';
import { checkPasswordStrength } from '@/lib/zxcvbn';

export const cadastroSchema = z
  .object({
    name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
    email: z.email({ message: 'Email inválido' }),
    password: z
      .string()
      .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
      .max(64, 'A senha deve ter no máximo 64 caracteres'),
    confirmPassword: z.string().min(8, { message: 'Confirme sua senha' })
  })
  .superRefine(async (data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não coincidem'
      });
    }

    const result = await checkPasswordStrength(data.password, [data.name, data.email]);

    if (result.score <= 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'A senha é muito fraca. Crie uma senha mais forte.'
      });
    }
  });

export type CadastroSchema = z.infer<typeof cadastroSchema>;
