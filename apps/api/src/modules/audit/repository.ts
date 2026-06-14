import { eq, and, count, desc, gte, lt, type SQL } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { auditLog, users } from '../../db/schema.js';

export type AuditListFilters = {
  entityType?: string;
  entityId?: number;
  userId?: number;
  action?: string;
  from?: string; // YYYY-MM-DD, inclusive
  to?: string; // YYYY-MM-DD, inclusive
};

function auditWhere(filters: AuditListFilters): SQL | undefined {
  const clauses: SQL[] = [];
  if (filters.entityType) clauses.push(eq(auditLog.entityType, filters.entityType));
  if (filters.entityId !== undefined) clauses.push(eq(auditLog.entityId, filters.entityId));
  if (filters.userId !== undefined) clauses.push(eq(auditLog.userId, filters.userId));
  if (filters.action) clauses.push(eq(auditLog.action, filters.action));
  // Date filters use UTC day boundaries against the timestamptz column. For an internal
  // accountability tool that's accurate enough; we deliberately don't reproject into APP_TZ.
  if (filters.from) {
    clauses.push(gte(auditLog.createdAt, new Date(`${filters.from}T00:00:00.000Z`)));
  }
  if (filters.to) {
    const end = new Date(`${filters.to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1); // exclusive upper bound = end-of-day inclusive
    clauses.push(lt(auditLog.createdAt, end));
  }
  return clauses.length ? and(...clauses) : undefined;
}

export async function listAudit(offset: number, limit: number, filters: AuditListFilters) {
  const where = auditWhere(filters);

  // leftJoin (not inner): keep audit rows whose actor was later deleted (FK is SET NULL).
  const rows = await db
    .select({
      id: auditLog.id,
      userId: auditLog.userId,
      userName: users.name,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      notes: auditLog.notes,
      changes: auditLog.changes,
      ipAddress: auditLog.ipAddress,
      createdAt: auditLog.createdAt
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(where)
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(auditLog).where(where);
  const total = countResult[0]?.count ?? 0;

  return { rows, total };
}
