import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { AppError } from '@/utils/errorFactory';

function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && error !== null && 'message' in error && 'statusCode' in error;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // 🧩 Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));

    res.status(400).json({
      error: 'Validation Error',
      details
    });
    return;
  }

  // 🧱 Known operational errors
  if (isAppError(err)) {
    console.error(`[Error ${err.statusCode}] ${err.message}`);
    if (!err.isOperational) console.error(err);

    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // 💥 Unexpected or unknown errors
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
}
