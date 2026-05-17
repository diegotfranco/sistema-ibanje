import { z } from 'zod';

export const MembershipLetterFormSchema = z.object({
  type: z
    .enum(['pedido_de_carta_de_transferência', 'carta_de_transferência'])
    .refine((v) => !!v, 'Tipo de carta obrigatório'),
  attenderId: z.number().int().positive('Congregado obrigatório'),
  letterDate: z.string().date('Data obrigatória no formato YYYY-MM-DD'),
  otherChurchName: z.string().min(1, 'Nome da igreja obrigatório').max(128),
  otherChurchAddress: z.string().max(256).nullable().optional().or(z.literal('')),
  otherChurchCity: z.string().min(1, 'Cidade obrigatória').max(96),
  otherChurchState: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres')
    .optional()
    .or(z.literal('')),
  additionalContext: z.string().max(2048).nullable().optional().or(z.literal(''))
});

export type MembershipLetterFormValues = z.infer<typeof MembershipLetterFormSchema>;

export type MembershipLetterResponse = {
  id: number;
  attenderId: number;
  type: 'pedido_de_carta_de_transferência' | 'carta_de_transferência';
  letterDate: string;
  otherChurchName: string;
  otherChurchAddress: string | null;
  otherChurchCity: string;
  otherChurchState: string | null;
  signingSecretaryName: string;
  signingSecretaryTitle: string;
  signingPresidentName: string;
  signingPresidentTitle: string;
  additionalContext: string | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
};
