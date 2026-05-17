import { z } from 'zod';

export const UpdateChurchSettingsRequestSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  cnpj: z.string().max(18).optional(),
  addressStreet: z.string().max(128).optional(),
  addressNumber: z.string().max(16).optional(),
  addressDistrict: z.string().max(64).optional(),
  addressCity: z.string().max(64).optional(),
  addressState: z.string().length(2).optional(),
  postalCode: z
    .string()
    .regex(/^\d{8}$/)
    .optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  websiteUrl: z.string().max(128).optional(),
  logoPath: z.string().optional(),
  currentPresidentName: z.string().max(96).optional(),
  currentPresidentTitle: z.string().max(48).optional(),
  currentSecretaryName: z.string().max(96).optional(),
  currentSecretaryTitle: z.string().max(48).optional()
});

export const ChurchSettingsResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  cnpj: z.string(),
  addressStreet: z.string(),
  addressNumber: z.string(),
  addressDistrict: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
  postalCode: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  logoPath: z.string().nullable(),
  currentPresidentName: z.string().nullable(),
  currentPresidentTitle: z.string().nullable(),
  currentSecretaryName: z.string().nullable(),
  currentSecretaryTitle: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type UpdateChurchSettingsRequest = z.infer<typeof UpdateChurchSettingsRequestSchema>;
export type ChurchSettingsResponse = z.infer<typeof ChurchSettingsResponseSchema>;
