type Error = {
  message: string;
  statusCode: number;
  isOperational: boolean;
};

function createError(
  message: string,
  statusCode: number,
  isOperational = true
): Error {
  return { message, statusCode, isOperational };
}

const errorDefinitions = {
  badRequest: { defaultMessage: "Bad Request", statusCode: 400 },
  unauthorized: { defaultMessage: "Unauthorized", statusCode: 401 },
  forbidden: { defaultMessage: "Forbidden", statusCode: 403 },
  notFound: { defaultMessage: "Not Found", statusCode: 404 },
  internal: { defaultMessage: "Internal Server Error", statusCode: 500 },
} as const;

export const Errors = Object.entries(errorDefinitions).reduce(
  (acc, [key, { defaultMessage, statusCode }]) => {
    acc[key as keyof typeof errorDefinitions] = (message?: string) =>
      createError(message ?? defaultMessage, statusCode);
    return acc;
  },
  {} as Record<string, (message?: string) => Error>
);
