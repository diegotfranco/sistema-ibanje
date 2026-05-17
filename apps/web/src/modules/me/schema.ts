import { z } from 'zod';

export const UpdateMyProfileFormSchema = z.object({
  phone: z.string().max(16, 'Máximo de 16 caracteres').optional().or(z.literal('')),
  email: z.email('E-mail inválido').optional().or(z.literal('')),
  addressStreet: z.string().max(96).optional().or(z.literal('')),
  addressNumber: z.number().int().positive('Deve ser um número positivo').optional(),
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

export type AttenderProfileResponse = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  addressStreet: string | null;
  addressNumber: number | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  isMember: boolean;
  memberSince: string | null;
  status: string;
};
