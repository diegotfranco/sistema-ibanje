import { z } from 'zod';

export const PasswordResetTokenEntity = z.object({
  id: z.number(),
  user_id: z.number().optional(),
  email: z.string(),
  token_hash: z.string(),
  created_at: z.date(),
  expires_at: z.date(),
  used_at: z.date().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional()
});

export type PasswordResetTokenEntity = z.infer<typeof PasswordResetTokenEntity>;
