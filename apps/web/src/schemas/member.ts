import { z } from 'zod';

export const MemberFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(96, 'Máximo de 96 caracteres'),
  userId: z.number().positive().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  phone: z.string().max(16, 'Máximo de 16 caracteres').optional().nullable(),
  email: z.string().email().optional().nullable(),
  addressStreet: z.string().max(96).optional().nullable(),
  addressNumber: z.number().int().positive().optional().nullable(),
  addressComplement: z.string().max(64).optional().nullable(),
  addressDistrict: z.string().max(64).optional().nullable(),
  state: z.string().length(2).optional().nullable(),
  city: z.string().max(96).optional().nullable(),
  postalCode: z
    .string()
    .regex(/^\d{8}$/, 'CEP inválido')
    .optional()
    .nullable()
});

export type MemberFormValues = z.infer<typeof MemberFormSchema>;

export type MemberResponse = {
  id: number;
  userId: number | null;
  name: string;
  birthDate: string | null;
  addressStreet: string | null;
  addressNumber: number | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: Date;
};
