import { z } from 'zod';

export const ListDesignatedFundsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateDesignatedFundRequestSchema = z.object({
  name: z.string().min(2).max(96),
  description: z.string().optional(),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'targetAmount must be a positive decimal with up to 2 decimal places')
    .optional()
});

export const UpdateDesignatedFundRequestSchema = CreateDesignatedFundRequestSchema.partial();

export type CreateDesignatedFundRequest = z.infer<typeof CreateDesignatedFundRequestSchema>;
export type UpdateDesignatedFundRequest = z.infer<typeof UpdateDesignatedFundRequestSchema>;

export type DesignatedFundResponse = {
  id: number;
  name: string;
  description: string | null;
  targetAmount: string | null;
  status: string;
  createdAt: Date;
};
