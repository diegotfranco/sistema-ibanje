import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

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

export const MinuteVersionResponseSchema = z.object({
  id: z.number().int().positive(),
  version: z.number().int().positive(),
  content: z.string(),
  status: z.enum(['aguardando aprovação', 'aprovada', 'substituída']),
  reasonForChange: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  approvedAtMeetingId: z.number().int().positive().nullable(),
  createdAt: z.string()
});

export const MinuteResponseSchema = z.object({
  id: z.number().int().positive(),
  boardMeetingId: z.number().int().positive(),
  minuteNumber: z.string(),
  isNotarized: z.boolean(),
  notarizedAt: z.string().nullable(),
  correctsMinuteId: z.number().int().positive().nullable(),
  currentVersion: MinuteVersionResponseSchema.nullable(),
  versions: z.array(MinuteVersionResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const MinuteListResponseSchema = paginatedSchema(MinuteResponseSchema);

export type CreateMinuteRequest = z.infer<typeof CreateMinuteRequestSchema>;
export type UpdateMinuteVersionRequest = z.infer<typeof UpdateMinuteVersionRequestSchema>;
export type EditApprovedMinuteRequest = z.infer<typeof EditApprovedMinuteRequestSchema>;
export type ApproveMinuteRequest = z.infer<typeof ApproveMinuteRequestSchema>;
export type MinuteVersionResponse = z.infer<typeof MinuteVersionResponseSchema>;
export type MinuteResponse = z.infer<typeof MinuteResponseSchema>;
