import { z } from 'zod';
import { paginatedSchema } from '../../../lib/http-schemas.js';
import { trimmedString } from '../../../lib/normalize.js';

export const ListPaymentMethodsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
  deleted: z.enum(['only', 'include']).optional()
});

export const CreatePaymentMethodRequestSchema = z
  .object({
    name: trimmedString(64, 2),
    allowsInflow: z.boolean().default(false),
    allowsOutflow: z.boolean().default(false)
  })
  .refine((d) => d.allowsInflow || d.allowsOutflow, {
    message: 'At least one of allowsInflow or allowsOutflow must be true'
  });

export const UpdatePaymentMethodRequestSchema = z.object({
  name: trimmedString(64, 2).optional(),
  allowsInflow: z.boolean().optional(),
  allowsOutflow: z.boolean().optional()
});

export const PaymentMethodResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  allowsInflow: z.boolean(),
  allowsOutflow: z.boolean(),
  status: z.string(),
  createdAt: z.date()
});

export const PaymentMethodListResponseSchema = paginatedSchema(PaymentMethodResponseSchema);

export type CreatePaymentMethodRequest = z.infer<typeof CreatePaymentMethodRequestSchema>;
export type UpdatePaymentMethodRequest = z.infer<typeof UpdatePaymentMethodRequestSchema>;
export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>;
