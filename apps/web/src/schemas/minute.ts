import { z } from 'zod';

export const MinuteFormSchema = z.object({
  boardMeetingId: z.number({ error: 'Reunião é obrigatória' }).int().positive(),
  minuteNumber: z.string().min(1, 'Número obrigatório').max(32),
  content: z.string().min(1, 'Conteúdo obrigatório')
});

export type MinuteFormValues = z.infer<typeof MinuteFormSchema>;

export const EditApprovedMinuteSchema = z.object({
  content: z.string().min(1, 'Conteúdo obrigatório'),
  reasonForChange: z.string().min(1, 'Motivo obrigatório').max(512)
});

export type EditApprovedMinuteValues = z.infer<typeof EditApprovedMinuteSchema>;

export const ApproveMinuteSchema = z.object({
  approvedAtMeetingId: z.number().int().positive().optional().nullable()
});

export type ApproveMinuteValues = z.infer<typeof ApproveMinuteSchema>;

export type MinuteVersionResponse = {
  id: number;
  version: number;
  content: string;
  status: 'aguardando aprovação' | 'aprovada' | 'substituída';
  reasonForChange: string | null;
  createdByUserId: number;
  approvedAtMeetingId: number | null;
  createdAt: string;
};

export type MinuteResponse = {
  id: number;
  boardMeetingId: number;
  minuteNumber: string;
  isNotarized: boolean;
  notarizedAt: string | null;
  correctsMinuteId: number | null;
  currentVersion: MinuteVersionResponse | null;
  versions: MinuteVersionResponse[];
  createdAt: string;
  updatedAt: string;
};
