import { z } from 'zod';

export const ListMinutesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateMinuteRequestSchema = z.object({
  boardMeetingId: z.number().int().positive(),
  minuteNumber: z.string().min(1).max(32),
  content: z.string().min(1)
});

export const UpdateMinuteVersionRequestSchema = z.object({
  content: z.string().min(1)
});

export const EditApprovedMinuteRequestSchema = z.object({
  content: z.string().min(1),
  reasonForChange: z.string().min(1).max(512)
});

export const ApproveMinuteRequestSchema = z.object({
  approvedAtMeetingId: z.number().int().positive().optional()
});

export type CreateMinuteRequest = z.infer<typeof CreateMinuteRequestSchema>;
export type UpdateMinuteVersionRequest = z.infer<typeof UpdateMinuteVersionRequestSchema>;
export type EditApprovedMinuteRequest = z.infer<typeof EditApprovedMinuteRequestSchema>;
export type ApproveMinuteRequest = z.infer<typeof ApproveMinuteRequestSchema>;

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
