import { db } from '../db/index.js';
import { auditLog } from '../db/schema.js';

type AuditAction = 'create' | 'update' | 'delete' | 'state_change';

export function logAudit(
  userId: number | null,
  action: AuditAction,
  entityType: string,
  entityId: number | null,
  opts?: { notes?: string; ipAddress?: string }
): void {
  // Fire-and-forget — never blocks the response, never throws
  db.insert(auditLog)
    .values({
      userId,
      action,
      entityType,
      entityId,
      notes: opts?.notes,
      ipAddress: opts?.ipAddress
    })
    .catch(() => {
      // Audit failure must not break the request flow
    });
}
