import { z } from 'zod';
import { AdmissionMode, ATTENDER_STATUS_VALUES } from '@sistema-ibanje/shared';

export const AttenderFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(96, 'Máximo de 96 caracteres'),
  userId: z.number().positive().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z.email().optional().nullable().or(z.literal('')),
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
    .nullable()
    .or(z.literal('')),
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

// Drives the lifecycle dialog (PATCH /attenders/:id/status). exitDate is required by the server
// when entering a formal-exit state; exitLetterId only applies to `transferido`.
export const AttenderStatusChangeSchema = z.object({
  status: z.enum(ATTENDER_STATUS_VALUES),
  exitDate: z.string().optional().nullable(),
  exitReason: z.string().max(256, 'Máximo de 256 caracteres').optional().nullable(),
  exitLetterId: z.number().int().positive().optional().nullable()
});

export type AttenderStatusChangeValues = z.infer<typeof AttenderStatusChangeSchema>;

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
  exitDate: string | null;
  exitReason: string | null;
  exitLetterId: number | null;
  isMember: boolean;
  baptismDate: string | null;
  memberSince: string | null;
  congregatingSince: string | null;
  admissionMode: string | null;
  createdAt: Date;
};
