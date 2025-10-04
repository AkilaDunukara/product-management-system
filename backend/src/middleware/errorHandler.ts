import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 * Handles different types of errors and returns consistent error responses
 */

interface JoiError extends Error {
  isJoi: boolean;
  details: Array<{
    message: string;
    path: string[];
    type: string;
    context?: { value?: any };
  }>;
}

interface DatabaseError extends Error {
  code?: string;
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    sellerId: req.sellerId,
    timestamp: new Date().toISOString()
  });

  // Joi validation errors
  if (err.isJoi) {
    const joiError = err as JoiError;
    res.status(400).json({
      error: 'Bad Request',
      message: `Validation error: ${joiError.details[0].message}`,
      error_code: 'VALIDATION_ERROR',
      details: {
        field: joiError.details[0].path.join('.'),
        constraint: joiError.details[0].type,
        value: joiError.details[0].context?.value
      }
    });
    return;
  }

  const dbError = err as DatabaseError;
  
  // PostgreSQL errors
  if (dbError.code === '23505') { // Unique constraint violation
    res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
      error_code: 'DUPLICATE_RESOURCE'
    });
    return;
  }

  if (dbError.code === '23503') { // Foreign key constraint violation
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid reference to related resource',
      error_code: 'INVALID_REFERENCE'
    });
    return;
  }

  if (dbError.code === '23514') { // Check constraint violation
    res.status(400).json({
      error: 'Bad Request',
      message: 'Data violates database constraints',
      error_code: 'CONSTRAINT_VIOLATION'
    });
    return;
  }

  if (dbError.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'File too large. Maximum size is 10MB.',
      error_code: 'FILE_TOO_LARGE'
    });
    return;
  }

  if (dbError.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Unexpected file field. Expected field name: "file"',
      error_code: 'INVALID_FILE_FIELD'
    });
    return;
  }

  if (err.message === 'Only CSV files are allowed') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid file type. Only CSV files are allowed.',
      error_code: 'INVALID_FILE_TYPE'
    });
    return;
  }

  if (err.message && err.message.includes('Redis')) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Rate limiting service temporarily unavailable',
      error_code: 'REDIS_ERROR'
    });
    return;
  }

  if (err.message && err.message.includes('Kafka')) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Event publishing service temporarily unavailable',
      error_code: 'KAFKA_ERROR'
    });
    return;
  }

  if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database service temporarily unavailable',
      error_code: 'DATABASE_ERROR'
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    error_code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      debug: {
        message: err.message,
        stack: err.stack
      }
    })
  });
};

export default errorHandler;
