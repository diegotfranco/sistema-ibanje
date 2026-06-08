import { z } from 'zod';
import { CAMPAIGN_STATUS_VALUES } from '@sistema-ibanje/shared';
import { paginatedSchema } from '../../../lib/http-schemas.js';

export const ListCampaignsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
  status: z.enum(CAMPAIGN_STATUS_VALUES).optional()
});

export const CreateCampaignRequestSchema = z.object({
  name: z.string().min(2).max(96),
  description: z.string().optional(),
  targetAmount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      'targetAmount must be a positive decimal with up to 2 decimal places'
    )
    .optional(),
  targetDate: z.string().date().nullable().optional()
});

export const UpdateCampaignRequestSchema = CreateCampaignRequestSchema.partial();

export const CampaignResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  targetAmount: z.string().nullable(),
  targetDate: z.string().nullable(),
  status: z.string(),
  createdAt: z.date()
});

export const CampaignListResponseSchema = paginatedSchema(CampaignResponseSchema);

export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;
export type UpdateCampaignRequest = z.infer<typeof UpdateCampaignRequestSchema>;
export type CampaignResponse = z.infer<typeof CampaignResponseSchema>;
