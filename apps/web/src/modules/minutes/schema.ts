import { z } from 'zod';
import { type MinuteStatusValue } from '@sistema-ibanje/shared';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MinuteFormSchema = z.object({
  meetingId: z.number().int().positive('Reunião é obrigatória'),
  minuteNumber: z.string().min(1, 'Número obrigatório').max(32),
  presidingPastorName: z.string().max(96).optional().or(z.literal('')),
  secretaryName: z.string().max(96).optional().or(z.literal('')),
  openingTime: z.string().regex(timeRegex, 'Formato HH:MM').optional().or(z.literal('')),
  closingTime: z.string().regex(timeRegex, 'Formato HH:MM').optional().or(z.literal(''))
});

export type MinuteFormValues = z.infer<typeof MinuteFormSchema>;

export const UpdateMinuteSchema = z.object({
  presidingPastorName: z.string().max(96).optional().or(z.literal('')),
  secretaryName: z.string().max(96).optional().or(z.literal('')),
  openingTime: z.string().regex(timeRegex, 'Formato HH:MM').optional().or(z.literal('')),
  closingTime: z.string().regex(timeRegex, 'Formato HH:MM').optional().or(z.literal(''))
});

export type UpdateMinuteValues = z.infer<typeof UpdateMinuteSchema>;

export const EditApprovedMinuteSchema = z.object({
  content: z.unknown().refine((v) => v !== null && typeof v === 'object', 'Conteúdo obrigatório'),
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
  content: unknown;
  status: MinuteStatusValue;
  reasonForChange: string | null;
  createdByUserId: number;
  approvedAtMeetingId: number | null;
  createdAt: string;
};

export type MinuteResponse = {
  id: number;
  meetingId: number;
  minuteNumber: string;
  presidingPastorName: string | null;
  secretaryName: string | null;
  openingTime: string | null;
  closingTime: string | null;
  attendersPresent: { id: number; name: string }[];
  pautas: string;
  signedDocumentPath: string | null;
  isNotarized: boolean;
  notarizedAt: string | null;
  correctsMinuteId: number | null;
  currentVersion: MinuteVersionResponse | null;
  versions: MinuteVersionResponse[];
  createdAt: string;
  updatedAt: string;
};
