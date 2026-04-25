import type { NextFunction, Request, Response } from 'express';

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function badRequest(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
}

export function unauthorized(message = 'Unauthorized') {
  const error = new Error(message) as Error & { status?: number };
  error.status = 401;
  return error;
}

export function forbidden(message = 'Forbidden') {
  const error = new Error(message) as Error & { status?: number };
  error.status = 403;
  return error;
}

export function notFound(message = 'Resource not found') {
  const error = new Error(message) as Error & { status?: number };
  error.status = 404;
  return error;
}
