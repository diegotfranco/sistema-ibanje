import type { Request, Response, NextFunction } from "express";

function isAppError(error: any): error is AppError {
  return (
    error &&
    typeof error.message === "string" &&
    typeof error.statusCode === "number"
  );
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = isAppError(err) ? err.statusCode : 500;
  const message = isAppError(err) ? err.message : "Internal Server Error";

  console.error(`[Error ${status}] ${message}`);
  if (!err.isOperational) console.error(err.stack);

  res.status(status).json({ error: message });
}
