import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

export const ListMinutesRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const CreateMinuteRequestSchema = z.object({
  meetingId: z.number().int().positive(),
  minuteNumber: z.string().min(1).max(32),
  presidingPastorName: z.string().max(96).optional(),
  secretaryName: z.string().max(96).optional(),
  openingTime: z.string().max(8).optional(),
  closingTime: z.string().max(8).optional()
});

export const UpdateMinuteVersionRequestSchema = z.object({
  content: z.unknown()
});

export const EditApprovedMinuteRequestSchema = z.object({
  content: z.unknown(),
  reasonForChange: z.string().min(1).max(512)
});

export const ApproveMinuteRequestSchema = z.object({
  approvedAtMeetingId: z.number().int().positive().optional()
});

export const MinuteVersionResponseSchema = z.object({
  id: z.number().int().positive(),
  version: z.number().int().positive(),
  content: z.unknown(),
  status: z.enum(['rascunho', 'aguardando aprovação', 'aprovada', 'substituída']),
  reasonForChange: z.string().nullable(),
  createdByUserId: z.number().int().positive(),
  approvedAtMeetingId: z.number().int().positive().nullable(),
  createdAt: z.string()
});

export const MinuteResponseSchema = z.object({
  id: z.number().int().positive(),
  meetingId: z.number().int().positive(),
  minuteNumber: z.string(),
  isNotarized: z.boolean(),
  notarizedAt: z.string().nullable(),
  correctsMinuteId: z.number().int().positive().nullable(),
  presidingPastorName: z.string().nullable(),
  secretaryName: z.string().nullable(),
  openingTime: z.string().nullable(),
  closingTime: z.string().nullable(),
  signedDocumentPath: z.string().nullable(),
  attendersPresent: z.array(z.object({ id: z.number().int().positive(), name: z.string() })),
  pautas: z.string(),
  currentVersion: MinuteVersionResponseSchema.nullable(),
  versions: z.array(MinuteVersionResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const MinuteListResponseSchema = paginatedSchema(MinuteResponseSchema);

export const UpdateMinuteRequestSchema = z.object({
  openingTime: z.string().max(8).optional(),
  closingTime: z.string().max(8).optional(),
  presidingPastorName: z.string().max(96).optional(),
  secretaryName: z.string().max(96).optional()
});

export const SetAttendersPresentSchema = z.object({
  attenderIds: z.array(z.number().int().positive())
});

export const AgendaItemTemplateSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2048).nullable().optional()
});

export const MinuteTemplateResponseSchema = z.object({
  id: z.number().int().positive(),
  meetingType: z.string(),
  name: z.string(),
  content: z.unknown(),
  isDefault: z.boolean(),
  defaultAgendaItems: z.array(AgendaItemTemplateSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateMinuteTemplateRequestSchema = z.object({
  meetingType: z.string(),
  name: z.string().min(1).max(128),
  content: z.unknown(),
  isDefault: z.boolean().default(false),
  defaultAgendaItems: z.array(AgendaItemTemplateSchema).default([])
});

export const UpdateMinuteTemplateRequestSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  content: z.unknown().optional(),
  isDefault: z.boolean().optional(),
  defaultAgendaItems: z.array(AgendaItemTemplateSchema).optional()
});

export type CreateMinuteRequest = z.infer<typeof CreateMinuteRequestSchema>;
export type UpdateMinuteVersionRequest = z.infer<typeof UpdateMinuteVersionRequestSchema>;
export type UpdateMinuteRequest = z.infer<typeof UpdateMinuteRequestSchema>;
export type EditApprovedMinuteRequest = z.infer<typeof EditApprovedMinuteRequestSchema>;
export type ApproveMinuteRequest = z.infer<typeof ApproveMinuteRequestSchema>;
export type MinuteVersionResponse = z.infer<typeof MinuteVersionResponseSchema>;
export type MinuteResponse = z.infer<typeof MinuteResponseSchema>;
export type AgendaItemTemplate = z.infer<typeof AgendaItemTemplateSchema>;
export type MinuteTemplateResponse = z.infer<typeof MinuteTemplateResponseSchema>;
export type CreateMinuteTemplateRequest = z.infer<typeof CreateMinuteTemplateRequestSchema>;
export type UpdateMinuteTemplateRequest = z.infer<typeof UpdateMinuteTemplateRequestSchema>;
export type SetAttendersPresent = z.infer<typeof SetAttendersPresentSchema>;
