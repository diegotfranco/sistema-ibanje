import { z } from 'zod';

export const DesignatedFundFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(96, 'Máximo de 96 caracteres'),
  description: z.string().max(500).optional().or(z.literal('')),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Use formato decimal com até 2 casas (ex.: 1000.00).')
    .optional()
    .or(z.literal(''))
});

export type DesignatedFundFormValues = z.infer<typeof DesignatedFundFormSchema>;

export type DesignatedFundResponse = {
  id: number;
  name: string;
  description: string | null;
  targetAmount: string | null;
  status: string;
  createdAt: string;
};
