import { z } from 'zod';

export const FinanceSettingsResponseSchema = z.object({
  openingBalance: z.string(),
  // True once the first monthly closing is `fechado`: at that point the opening
  // balance has been consumed into a permanent record, so editing is frozen for
  // everyone except an Administrador (human-error correction).
  lockedByClosing: z.boolean(),
  updatedAt: z.date()
});

export const UpdateFinanceSettingsRequestSchema = z.object({
  openingBalance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Informe um valor válido (ex: 1234.56)')
});

export type FinanceSettingsResponse = z.infer<typeof FinanceSettingsResponseSchema>;
export type UpdateFinanceSettingsRequest = z.infer<typeof UpdateFinanceSettingsRequestSchema>;
