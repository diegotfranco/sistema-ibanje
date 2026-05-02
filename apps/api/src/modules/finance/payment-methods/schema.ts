import { z } from 'zod';

export const ListPaymentMethodsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreatePaymentMethodRequestSchema = z
  .object({
    name: z.string().min(2).max(64),
    allowsInflow: z.boolean().default(false),
    allowsOutflow: z.boolean().default(false)
  })
  .refine((d) => d.allowsInflow || d.allowsOutflow, {
    message: 'At least one of allowsInflow or allowsOutflow must be true'
  });

export const UpdatePaymentMethodRequestSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  allowsInflow: z.boolean().optional(),
  allowsOutflow: z.boolean().optional()
});

export type CreatePaymentMethodRequest = z.infer<typeof CreatePaymentMethodRequestSchema>;
export type UpdatePaymentMethodRequest = z.infer<typeof UpdatePaymentMethodRequestSchema>;

export type PaymentMethodResponse = {
  id: number;
  name: string;
  allowsInflow: boolean;
  allowsOutflow: boolean;
  status: string;
  createdAt: Date;
};
