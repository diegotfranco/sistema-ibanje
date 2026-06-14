import { z } from 'zod';
import { paginatedSchema } from '../../lib/http-schemas.js';

// Read-only accountability surface (LGPD Art. 37 — record of processing). Filters are all optional
// and coerced from the querystring; pagination is capped at the Zod boundary like every other list.
export const ListAuditRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  entityType: z.string().min(1).max(64).optional(),
  entityId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  action: z.string().min(1).max(32).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional()
});
export type ListAuditRequest = z.infer<typeof ListAuditRequestSchema>;

export const AuditEntryResponseSchema = z.object({
  id: z.number().int().positive(),
  // Nullable: the FK is ON DELETE SET NULL, so the actor row may have been removed since.
  userId: z.number().int().positive().nullable(),
  userName: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.number().int().nullable(),
  notes: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.date()
});
export type AuditEntryResponse = z.infer<typeof AuditEntryResponseSchema>;

export const AuditListResponseSchema = paginatedSchema(AuditEntryResponseSchema);
