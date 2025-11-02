import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/utils/errorFactory';

// Postgres error codes reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERRORS = {
  INVALID_TEXT_REPRESENTATION: '22P02',
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
  CHECK_VIOLATION: '23514',
  UNDEFINED_COLUMN: '42703'
};

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

  // 🧱 Known AppError (operational)
  if (err instanceof AppError) {
    console.error(`[Error ${err.statusCode}] ${err.message}`);
    if (!err.isOperational) console.error(err);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // 🗃️ Handle Postgres errors
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const pgErr = err as { code: string; message: string; detail?: string };
    console.error('[Postgres Error]', pgErr);

    switch (pgErr.code) {
      case PG_ERRORS.INVALID_TEXT_REPRESENTATION:
        res.status(400).json({ error: 'Invalid input format.' });
        return;

      case PG_ERRORS.NOT_NULL_VIOLATION:
        res.status(400).json({ error: 'Missing required field.' });
        return;

      case PG_ERRORS.FOREIGN_KEY_VIOLATION:
        res.status(400).json({ error: 'Invalid reference. Related record does not exist.' });
        return;

      case PG_ERRORS.UNIQUE_VIOLATION:
        res.status(409).json({ error: 'Duplicate record violates unique constraint' });
        return;

      case PG_ERRORS.CHECK_VIOLATION:
        res.status(400).json({ error: 'Constraint check failed.' });
        return;

      case PG_ERRORS.UNDEFINED_COLUMN:
        res.status(400).json({ error: 'Invalid column reference in query.' });
        return;

      default:
        res.status(500).json({ error: 'Database error occurred.' });
        return;
    }
  }

  // 💥 Fallback for unknown or unhandled errors
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
}
