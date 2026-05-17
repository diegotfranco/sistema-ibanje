import { z } from 'zod';

export type ChurchSettingsResponse = {
  id: number;
  name: string;
  cnpj: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  logoPath: string | null;
  currentPresidentName: string | null;
  currentPresidentTitle: string | null;
  currentSecretaryName: string | null;
  currentSecretaryTitle: string | null;
  createdAt: string;
  updatedAt: string;
};

export const ChurchSettingsFormSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(128),
  cnpj: z.string().max(18).optional().or(z.literal('')),
  addressStreet: z.string().min(1, 'Rua obrigatória').max(128),
  addressNumber: z.string().min(1, 'Número obrigatório').max(16),
  addressDistrict: z.string().min(1, 'Bairro obrigatório').max(64),
  addressCity: z.string().min(1, 'Cidade obrigatória').max(64),
  addressState: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres')
    .transform((v) => v.toUpperCase()),
  postalCode: z
    .string()
    .regex(/^\d{8}$/, 'Código postal deve ter 8 dígitos')
    .max(8),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  websiteUrl: z.string().max(128).optional().or(z.literal('')),
  currentPresidentName: z.string().max(96).optional().or(z.literal('')),
  currentPresidentTitle: z.string().max(48).optional().or(z.literal('')),
  currentSecretaryName: z.string().max(96).optional().or(z.literal('')),
  currentSecretaryTitle: z.string().max(48).optional().or(z.literal(''))
});

export type ChurchSettingsFormValues = z.infer<typeof ChurchSettingsFormSchema>;
