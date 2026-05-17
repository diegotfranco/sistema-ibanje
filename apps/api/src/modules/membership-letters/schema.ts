import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListMembershipLettersRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  attenderId: z.coerce.number().int().positive().optional(),
  type: z.enum(['pedido_de_carta_de_transferência', 'carta_de_transferência']).optional()
});

export const CreateMembershipLetterRequestSchema = z.object({
  attenderId: z.number().int().positive(),
  type: z.enum(['pedido_de_carta_de_transferência', 'carta_de_transferência']),
  letterDate: z.string().date(),
  otherChurchName: z.string().min(1).max(128),
  otherChurchAddress: z.string().max(256).optional(),
  otherChurchCity: z.string().min(1).max(96),
  otherChurchState: z.string().length(2).optional(),
  additionalContext: z.string().optional()
});

export const UpdateMembershipLetterRequestSchema = z.object({
  letterDate: z.string().date().optional(),
  otherChurchName: z.string().min(1).max(128).optional(),
  otherChurchAddress: z.string().max(256).optional(),
  otherChurchCity: z.string().min(1).max(96).optional(),
  otherChurchState: z.string().length(2).optional(),
  additionalContext: z.string().optional()
});

export const MembershipLetterResponseSchema = z.object({
  id: z.number().int().positive(),
  attenderId: z.number().int().positive(),
  type: z.enum(['pedido_de_carta_de_transferência', 'carta_de_transferência']),
  letterDate: z.string(),
  otherChurchName: z.string(),
  otherChurchAddress: z.string().nullable(),
  otherChurchCity: z.string(),
  otherChurchState: z.string().nullable(),
  signingSecretaryName: z.string(),
  signingSecretaryTitle: z.string(),
  signingPresidentName: z.string(),
  signingPresidentTitle: z.string(),
  additionalContext: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const MembershipLetterListResponseSchema = paginatedSchema(MembershipLetterResponseSchema);

export type ListMembershipLettersRequest = z.infer<typeof ListMembershipLettersRequestSchema>;
export type CreateMembershipLetterRequest = z.infer<typeof CreateMembershipLetterRequestSchema>;
export type UpdateMembershipLetterRequest = z.infer<typeof UpdateMembershipLetterRequestSchema>;
export type MembershipLetterResponse = z.infer<typeof MembershipLetterResponseSchema>;
