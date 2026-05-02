import { z } from 'zod';

export const ListMembersRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateMemberRequestSchema = z.object({
  userId: z.number().int().positive().optional(),
  name: z.string().min(2).max(96),
  birthDate: z.iso.date().optional(),
  addressStreet: z.string().max(96).optional(),
  addressNumber: z.number().int().positive().optional(),
  addressComplement: z.string().max(64).optional(),
  addressDistrict: z.string().max(64).optional(),
  state: z.string().length(2).optional(),
  city: z.string().max(96).optional(),
  postalCode: z.string().regex(/^\d{8}$/).optional(),
  email: z.email().optional(),
  phone: z.string().max(16).optional()
});

export const UpdateMemberRequestSchema = CreateMemberRequestSchema.partial();

export type CreateMemberRequest = z.infer<typeof CreateMemberRequestSchema>;
export type UpdateMemberRequest = z.infer<typeof UpdateMemberRequestSchema>;

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
