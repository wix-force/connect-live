import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`[${err.statusCode}] ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    logger.error('Validation error:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      data: err.message,
    });
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    logger.error('Duplicate key error:', err.message);
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Unknown error
  logger.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
