export function httpError(
  statusCode: number,
  message: string,
  options?: { fieldErrors?: Record<string, string> }
): Error & { statusCode: number; fieldErrors?: Record<string, string> } {
  return Object.assign(new Error(message), { statusCode, fieldErrors: options?.fieldErrors });
}

export function isHttpError(
  err: unknown
): err is Error & { statusCode: number; fieldErrors?: Record<string, string> } {
  return (
    err instanceof Error &&
    'statusCode' in err &&
    typeof (err as { statusCode: unknown }).statusCode === 'number'
  );
}

export function isUniqueViolation(err: unknown, constraintName?: string): boolean {
  // Drizzle (>=0.45) wraps the postgres.js driver error in a DrizzleQueryError, so the PG `code`
  // and `constraint_name` live on `.cause`, not the top-level error. Walk the cause chain so the
  // check works whether handed the raw PostgresError or Drizzle's wrapper.
  let cur: unknown = err;
  while (cur instanceof Error) {
    const e = cur as { code?: string; constraint_name?: string };
    if (e.code === '23505' && (!constraintName || e.constraint_name === constraintName)) {
      return true;
    }
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}
