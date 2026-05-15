import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListAttendersRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateAttenderRequestSchema = z.object({
  userId: z.number().int().positive().optional(),
  name: z.string().min(2).max(96),
  birthDate: z.iso.date().optional(),
  addressStreet: z.string().max(96).optional(),
  addressNumber: z.number().int().positive().optional(),
  addressComplement: z.string().max(64).optional(),
  addressDistrict: z.string().max(64).optional(),
  state: z.string().length(2).optional(),
  city: z.string().max(96).optional(),
  postalCode: z
    .string()
    .regex(/^\d{8}$/)
    .optional(),
  email: z.email().optional(),
  phone: z.string().max(16).optional(),
  isMember: z.boolean().optional().default(false),
  memberSince: z.string().date().nullable().optional(),
  congregatingSinceYear: z.number().int().min(1900).max(2100).nullable().optional(),
  admissionMode: z
    .enum(['aclamação', 'batismo', 'carta de transferência', 'profissão de fé'])
    .nullable()
    .optional()
});

export const UpdateAttenderRequestSchema = CreateAttenderRequestSchema.partial();

export const AttenderResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive().nullable(),
  name: z.string(),
  birthDate: z.string().nullable(),
  addressStreet: z.string().nullable(),
  addressNumber: z.number().int().nullable(),
  addressComplement: z.string().nullable(),
  addressDistrict: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.string(),
  isMember: z.boolean(),
  memberSince: z.string().nullable(),
  congregatingSinceYear: z.number().int().nullable(),
  admissionMode: z.string().nullable(),
  createdAt: z.date()
});

export const AttenderListResponseSchema = paginatedSchema(AttenderResponseSchema);

export type CreateAttenderRequest = z.infer<typeof CreateAttenderRequestSchema>;
export type UpdateAttenderRequest = z.infer<typeof UpdateAttenderRequestSchema>;
export type AttenderResponse = z.infer<typeof AttenderResponseSchema>;
