import { isNull, isNotNull, type Column, type SQL } from 'drizzle-orm';

/**
 * Soft-delete filter. Compose into a query's WHERE (typically inside `and(...)`) so that
 * soft-deleted rows — those with a non-null `deleted_at` — are excluded uniformly.
 *
 * `deletedAt` is orthogonal to `status`: status models domain lifecycle / availability,
 * while `deletedAt` means "this row shouldn't exist (data-entry mistake), hide it everywhere."
 * Restoring a row is just clearing `deletedAt` back to NULL.
 *
 * Usage: `.where(and(notDeleted(table), eq(table.status, 'ativo')))`
 */
export function notDeleted(table: { deletedAt: Column }) {
  return isNull(table.deletedAt);
}

/**
 * Which slice of rows a list query should return, w.r.t. soft-delete:
 * - `undefined` (default) → only live rows (`notDeleted`).
 * - `'only'` → only soft-deleted rows — powers a "Lixeira" (trash) view.
 * - `'include'` → both live and deleted rows (no filter).
 */
export type DeletedFilter = 'only' | 'include';

/**
 * Resolve a {@link DeletedFilter} to a WHERE fragment. Returns `undefined` for `'include'`
 * so callers can pass the result straight to `.where(...)` (Drizzle treats `undefined` as
 * "no condition"). For the default and `'only'` cases it yields the matching `deleted_at`
 * predicate. Compose with other conditions via `and(deletedClause(t, mode), eq(...))`.
 */
export function deletedClause(table: { deletedAt: Column }, mode?: DeletedFilter): SQL | undefined {
  if (mode === 'include') return undefined;
  if (mode === 'only') return isNotNull(table.deletedAt);
  return notDeleted(table);
}
