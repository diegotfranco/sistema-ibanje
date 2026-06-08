import { z } from 'zod';

export const CampaignFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(96, 'Máximo de 96 caracteres'),
  description: z.string().max(500).optional().or(z.literal('')),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Use formato decimal com até 2 casas (ex.: 1000.00).')
    .optional()
    .or(z.literal('')),
  targetDate: z.string().optional().nullable()
});

export type CampaignFormValues = z.infer<typeof CampaignFormSchema>;

export type CampaignResponse = {
  id: number;
  name: string;
  description: string | null;
  targetAmount: string | null;
  targetDate: string | null;
  status: string;
  createdAt: string;
};
