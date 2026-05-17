import { z } from 'zod';

export const PaymentMethodFormSchema = z
  .object({
    name: z.string().min(2, 'Mínimo de 2 caracteres').max(64, 'Máximo de 64 caracteres'),
    allowsInflow: z.boolean(),
    allowsOutflow: z.boolean()
  })
  .refine((d) => d.allowsInflow || d.allowsOutflow, {
    message: 'Selecione ao menos entrada ou saída.',
    path: ['allowsInflow']
  });

export type PaymentMethodFormValues = z.infer<typeof PaymentMethodFormSchema>;

export type PaymentMethodResponse = {
  id: number;
  name: string;
  allowsInflow: boolean;
  allowsOutflow: boolean;
  status: string;
  createdAt: string;
};
