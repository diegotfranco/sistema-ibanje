import { z } from 'zod';
import { AdmissionMode } from '@sistema-ibanje/shared';

export const AttenderFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(96, 'Máximo de 96 caracteres'),
  userId: z.number().positive().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  phone: z.string().max(16, 'Máximo de 16 caracteres').optional().nullable(),
  email: z.email().optional().nullable(),
  addressStreet: z.string().max(96).optional().nullable(),
  addressNumber: z.string().max(16).optional().nullable(),
  addressComplement: z.string().max(64).optional().nullable(),
  addressDistrict: z.string().max(64).optional().nullable(),
  state: z.string().length(2).optional().nullable(),
  city: z.string().max(96).optional().nullable(),
  postalCode: z
    .string()
    .regex(/^\d{8}$/, 'CEP inválido')
    .optional()
    .nullable(),
  isMember: z.boolean().optional().default(false),
  // Month-granular fields use the `YYYY-MM` wire format (DB stores them as YYYYMM ints).
  memberSince: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Formato esperado: MM/AAAA')
    .optional()
    .nullable(),
  baptismDate: z.string().optional().nullable(),
  congregatingSince: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Formato esperado: MM/AAAA')
    .optional()
    .nullable(),
  admissionMode: z
    .enum([
      AdmissionMode.Acclamation,
      AdmissionMode.Baptism,
      AdmissionMode.TransferLetter,
      AdmissionMode.FaithProfession
    ] as const)
    .optional()
    .nullable()
});

export type AttenderFormValues = z.infer<typeof AttenderFormSchema>;

export type AttenderResponse = {
  id: number;
  userId: number | null;
  name: string;
  birthDate: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  isMember: boolean;
  baptismDate: string | null;
  memberSince: string | null;
  congregatingSince: string | null;
  admissionMode: string | null;
  createdAt: Date;
};
