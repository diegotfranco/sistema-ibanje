import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListMinutesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateMinuteRequestSchema = z.object({
  boardMeetingId: z.number().int().positive(),
  minuteNumber: z.string().min(1).max(32),
  presidingPastorName: z.string().max(96).optional(),
  secretaryName: z.string().max(96).optional(),
  openingHymnReference: z.string().max(128).optional(),
  openingBibleReference: z.string().max(64).optional(),
  openingTime: z.string().max(8).optional(),
  closingTime: z.string().max(8).optional(),
  membersPresentCount: z.number().int().optional()
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
  status: z.enum(['rascunho', 'aguardando aprovação', 'aprovada', 'substituída']),
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
  presidingPastorName: z.string().nullable(),
  secretaryName: z.string().nullable(),
  openingHymnReference: z.string().nullable(),
  openingBibleReference: z.string().nullable(),
  openingTime: z.string().nullable(),
  closingTime: z.string().nullable(),
  membersPresentCount: z.number().int().nullable(),
  signedDocumentPath: z.string().nullable(),
  currentVersion: MinuteVersionResponseSchema.nullable(),
  versions: z.array(MinuteVersionResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const MinuteListResponseSchema = paginatedSchema(MinuteResponseSchema);

export const UpdateMinuteRequestSchema = z.object({
  openingHymnReference: z.string().max(128).optional(),
  openingBibleReference: z.string().max(64).optional(),
  openingTime: z.string().max(8).optional(),
  closingTime: z.string().max(8).optional(),
  membersPresentCount: z.number().int().optional(),
  presidingPastorName: z.string().max(96).optional(),
  secretaryName: z.string().max(96).optional()
});

export const MinuteTemplateResponseSchema = z.object({
  id: z.number().int().positive(),
  meetingType: z.string(),
  name: z.string(),
  content: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const UpdateMinuteTemplateRequestSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  content: z.string().optional(),
  isDefault: z.boolean().optional()
});

export type CreateMinuteRequest = z.infer<typeof CreateMinuteRequestSchema>;
export type UpdateMinuteVersionRequest = z.infer<typeof UpdateMinuteVersionRequestSchema>;
export type UpdateMinuteRequest = z.infer<typeof UpdateMinuteRequestSchema>;
export type EditApprovedMinuteRequest = z.infer<typeof EditApprovedMinuteRequestSchema>;
export type ApproveMinuteRequest = z.infer<typeof ApproveMinuteRequestSchema>;
export type MinuteVersionResponse = z.infer<typeof MinuteVersionResponseSchema>;
export type MinuteResponse = z.infer<typeof MinuteResponseSchema>;
export type MinuteTemplateResponse = z.infer<typeof MinuteTemplateResponseSchema>;
export type UpdateMinuteTemplateRequest = z.infer<typeof UpdateMinuteTemplateRequestSchema>;
