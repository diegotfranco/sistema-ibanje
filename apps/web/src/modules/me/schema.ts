import { z } from 'zod';
import { newPasswordField } from '@/lib/password';

export const UpdateMyProfileFormSchema = z.object({
  phone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  email: z.email('E-mail inválido').optional().or(z.literal('')),
  addressStreet: z.string().max(96).optional().or(z.literal('')),
  addressNumber: z.string().max(16, 'Máximo de 16 caracteres').optional().or(z.literal('')),
  addressComplement: z.string().max(64).optional().or(z.literal('')),
  addressDistrict: z.string().max(64).optional().or(z.literal('')),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').optional().or(z.literal('')),
  city: z.string().max(96).optional().or(z.literal('')),
  postalCode: z
    .string()
    .regex(/^\d{8}$/, 'CEP inválido')
    .optional()
    .or(z.literal(''))
});

export type UpdateMyProfileFormValues = z.infer<typeof UpdateMyProfileFormSchema>;

// Self-service password change. Self must supply the current password (the backend compares
// session.userId vs :id) — mirrors the reset-password confirm-match pattern in auth/schema.ts.
export const ChangeMyPasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirme a nova senha')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });

export type ChangeMyPasswordFormValues = z.infer<typeof ChangeMyPasswordFormSchema>;

export type AttenderProfileResponse = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  isMember: boolean;
  memberSince: string | null;
  status: string;
};
