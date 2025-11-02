export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
  }
}

//create success definitions enum and rename file to httpFactory (or smth like that)

const errorDefinitions = {
  badRequest: { defaultMessage: 'Bad Request', statusCode: 400 },
  unauthorized: { defaultMessage: 'Unauthorized', statusCode: 401 },
  forbidden: { defaultMessage: 'Forbidden', statusCode: 403 },
  notFound: { defaultMessage: 'Not Found', statusCode: 404 },
  conflict: { defaultMessage: 'Conflict', statusCode: 409 },
  internal: { defaultMessage: 'Internal Server Error', statusCode: 500 }
} as const;

export const Errors = Object.entries(errorDefinitions).reduce(
  (acc, [key, { defaultMessage, statusCode }]) => {
    acc[key as keyof typeof errorDefinitions] = (message?: string): AppError =>
      new AppError(message ?? defaultMessage, statusCode);
    return acc;
  },
  {} as Record<keyof typeof errorDefinitions, (message?: string) => AppError>
);
