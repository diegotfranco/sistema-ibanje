export function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

export function isHttpError(err: unknown): err is Error & { statusCode: number } {
  return (
    err instanceof Error &&
    'statusCode' in err &&
    typeof (err as { statusCode: unknown }).statusCode === 'number'
  );
}
