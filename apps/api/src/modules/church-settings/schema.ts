import { z } from 'zod';
import {
  cnpjField,
  phoneField,
  cepField,
  optionalEmailField,
  ufField,
  trimmedString
} from '../../lib/normalize.js';

export const UpdateChurchSettingsRequestSchema = z.object({
  name: trimmedString(128).optional(),
  cnpj: cnpjField.optional(),
  addressStreet: trimmedString(128).optional(),
  addressNumber: trimmedString(16).optional(),
  addressDistrict: trimmedString(64).optional(),
  addressCity: trimmedString(64).optional(),
  addressState: ufField.optional(),
  postalCode: cepField.optional(),
  phone: phoneField.optional(),
  email: optionalEmailField.optional(),
  websiteUrl: trimmedString(128).optional(),
  logoPath: z.string().optional(),
  currentPresidentName: trimmedString(96).optional(),
  currentPresidentTitle: trimmedString(48).optional(),
  currentSecretaryName: trimmedString(96).optional(),
  currentSecretaryTitle: trimmedString(48).optional()
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
