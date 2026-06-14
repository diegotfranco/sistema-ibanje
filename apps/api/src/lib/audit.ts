import { db } from '../db/index.js';
import { auditLog } from '../db/schema.js';

type AuditAction = 'create' | 'update' | 'delete' | 'restore' | 'state_change';

export type AuditChanges = Record<string, { from: unknown; to: unknown }>;

// Fields that are never meaningful in a human-facing diff (or must never surface). The
// passwordHash guard is belt-and-suspenders — diffs are computed from shaped service rows that
// already omit it.
const DIFF_EXCLUDE = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'passwordHash',
  // Derived rollup that mirrors `amount` on entries — showing both is noise.
  'total',
  // Monthly-closing transition bookkeeping: WHO did it and WHEN is already on the audit row itself
  // (userName + createdAt), so re-listing it in the diff is redundant and shows raw ids/timestamps.
  'submittedByUserId',
  'submittedAt',
  'reviewedAt',
  'closedByUserId',
  'closedAt'
]);

/**
 * Application-level field diff between a before- and after-snapshot. Returns only changed fields as
 * `{ [field]: { from, to } }`, or `undefined` when nothing meaningful changed. Inputs should be the
 * shaped rows the service already holds (the 404-check fetch and the update return).
 */
// Treat '', null and undefined as the same "no value" so they never diff against each other.
function blankToNull(value: unknown): unknown {
  return value === '' || value === undefined ? null : value;
}

export function diffEntity(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  opts?: { exclude?: string[] }
): AuditChanges | undefined {
  const exclude = new Set([...DIFF_EXCLUDE, ...(opts?.exclude ?? [])]);
  const changes: AuditChanges = {};

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (exclude.has(key)) continue;
    // Coalesce empty string with null/undefined: a nullable column and a `''`-defaulted column model
    // "no value" differently, and the Zod normalize boundary can swap one for the other on save. Left
    // as-is they'd surface a phantom "— → —" diff (e.g. email/website on church settings).
    const a = blankToNull(before[key]);
    const b = blankToNull(after[key]);
    // Normalize via JSON so Date/array/object shapes compare by value, not reference.
    if (!Object.is(a, b) && JSON.stringify(a) !== JSON.stringify(b)) {
      changes[key] = { from: a, to: b };
    }
  }

  return Object.keys(changes).length ? changes : undefined;
}

/**
 * Diff two flat lists of grant labels (e.g. "Financeiro · Cadastrar") into the standard
 * `{ [grant]: { from, to } }` shape — `false → true` for a grant added, `true → false` for one
 * removed. Only changed grants appear, so a small toggle stays small. Used by permission updates,
 * which have no flat-field diff of their own.
 */
export function diffGrants(before: string[], after: string[]): AuditChanges | undefined {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const changes: AuditChanges = {};
  for (const grant of afterSet)
    if (!beforeSet.has(grant)) changes[grant] = { from: false, to: true };
  for (const grant of beforeSet)
    if (!afterSet.has(grant)) changes[grant] = { from: true, to: false };
  return Object.keys(changes).length ? changes : undefined;
}

/**
 * Null-tolerant wrapper for diffing two response DTOs in a controller — `before` is the pre-mutation
 * `getById` read, `after` is the update's returned resource. Returns undefined if either is missing.
 */
export function diffResponse(before: unknown, after: unknown): AuditChanges | undefined {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
    return undefined;
  }
  return diffEntity(before as Record<string, unknown>, after as Record<string, unknown>);
}

export function logAudit(
  userId: number | null,
  action: AuditAction,
  entityType: string,
  entityId: number | null,
  opts?: { notes?: string; ipAddress?: string; changes?: AuditChanges }
): void {
  // Fire-and-forget — never blocks the response, never throws
  db.insert(auditLog)
    .values({
      userId,
      action,
      entityType,
      entityId,
      notes: opts?.notes,
      changes: opts?.changes ?? null,
      ipAddress: opts?.ipAddress
    })
    .catch(() => {
      // Audit failure must not break the request flow
    });
}
