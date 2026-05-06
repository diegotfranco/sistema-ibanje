import { z } from 'zod';

export const UserCreateFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(96, 'Máximo de 96 caracteres'),
  email: z.string().email('E-mail inválido'),
  roleId: z.number({ message: 'Cargo é obrigatório.' }).int().positive(),
  memberId: z.number().int().positive().optional().nullable()
});

export const UserEditFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(96, 'Máximo de 96 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  roleId: z.number().int().positive().optional()
});

export type UserCreateFormValues = z.infer<typeof UserCreateFormSchema>;
export type UserEditFormValues = z.infer<typeof UserEditFormSchema>;

export type UserResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number;
  status: string;
  createdAt: string;
};
