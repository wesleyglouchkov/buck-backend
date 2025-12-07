import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { formatZodErrors } from '../utils/validation';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${err.message}`, err);

  // Prisma Unique Constraint Violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const message = 'Duplicate field value entered';
      error = { name: 'UniqueConstraintViolation', message, statusCode: 400 } as ApiError;
    }
    if (err.code === 'P2025') {
      const message = 'Resource not found';
      error = { name: 'ResourceNotFound', message, statusCode: 404 } as ApiError;
    }
  }

  // Prisma Validation Error
  if (err instanceof Prisma.PrismaClientValidationError) {
    const message = 'Validation Error';
    error = { name: 'ValidationError', message, statusCode: 400 } as ApiError;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = formatZodErrors(err);
    const message = formattedErrors.map((e: any) => `${e.name}: ${e.message}`).join(', ');
    error = { name: 'ValidationError', message, statusCode: 400 } as ApiError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
