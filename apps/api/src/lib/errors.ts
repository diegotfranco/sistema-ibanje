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
  if (!(err instanceof Error)) return false;
  const e = err as { code?: string; constraint_name?: string };
  if (e.code !== '23505') return false;
  if (constraintName && e.constraint_name !== constraintName) return false;
  return true;
}
