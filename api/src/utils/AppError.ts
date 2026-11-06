/** Every error returned by the API carries one of these machine-readable codes. */
export const ErrorCode = {
  VALIDATION: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL: 'INTERNAL_ERROR',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest = (msg: string, details?: unknown) =>
    new AppError(400, ErrorCode.BAD_REQUEST, msg, details);
  static unauthorized = (msg = 'Authentication required') => new AppError(401, ErrorCode.UNAUTHORIZED, msg);
  static forbidden = (msg = 'You do not have permission to do that') =>
    new AppError(403, ErrorCode.FORBIDDEN, msg);
  static notFound = (msg = 'Resource not found') => new AppError(404, ErrorCode.NOT_FOUND, msg);
  static conflict = (msg: string) => new AppError(409, ErrorCode.CONFLICT, msg);
  static unavailable = (msg: string) => new AppError(503, ErrorCode.UNAVAILABLE, msg);
}
