import { z } from 'zod'

export const CreateMemberSchema = z.object({
  user_id:            z.number().int().optional(),
  name:               z.string().min(2).max(96),
  birth_date:         z.string().date().optional(),
  address_street:     z.string().max(96).optional(),
  address_number:     z.number().int().optional(),
  address_complement: z.string().max(64).optional(),
  address_district:   z.string().max(64).optional(),
  state:              z.string().length(2).optional(),
  city:               z.string().max(96).optional(),
  postal_code:        z.string().regex(/^\d{8}$/).optional(),
  email:              z.email().optional(),
  phone:              z.string().max(16).optional(),
})

export const UpdateMemberSchema = CreateMemberSchema.partial()

export type CreateMemberDTO = z.infer<typeof CreateMemberSchema>
export type UpdateMemberDTO = z.infer<typeof UpdateMemberSchema>