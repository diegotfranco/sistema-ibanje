import { z } from 'zod';

export const PasswordResetTokenDTO = z.object({
  id: z.number().int(),
  user_id: z.number().int().nullable(),
  email: z.string().max(320),
  token_hash: z.string().length(64),
  created_at: z.coerce.date(),
  expires_at: z.coerce.date(),
  used_at: z.coerce.date().nullable(),
  ip_address: z.string().max(45).nullable(),
  user_agent: z.string().nullable()
});

export type PasswordResetTokenDTO = z.infer<typeof PasswordResetTokenDTO>;
