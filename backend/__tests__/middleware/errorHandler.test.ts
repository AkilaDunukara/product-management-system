import { Request, Response, NextFunction } from 'express';
import errorHandler from '../../src/middleware/errorHandler';

/**
 * Error Handler Middleware Tests
 * Test suite for global error handling with different error types
 */
describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET',
      sellerId: 'seller-123'
    } as Partial<Request>;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('Joi validation errors', () => {
    it('should handle Joi validation errors', () => {
      const error: any = {
        isJoi: true,
        details: [{
          message: 'name is required',
          path: ['name'],
          type: 'any.required',
          context: { value: undefined }
        }]
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Validation error: name is required',
        error_code: 'VALIDATION_ERROR',
        details: {
          field: 'name',
          constraint: 'any.required',
          value: undefined
        }
      });
    });
  });

  describe('PostgreSQL errors', () => {
    it('should handle unique constraint violation', () => {
      const error: any = {
        code: '23505',
        message: 'duplicate key value violates unique constraint'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Conflict',
        message: 'Resource already exists',
        error_code: 'DUPLICATE_RESOURCE'
      });
    });

    it('should handle foreign key constraint violation', () => {
      const error: any = {
        code: '23503',
        message: 'foreign key constraint violation'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid reference to related resource',
        error_code: 'INVALID_REFERENCE'
      });
    });

    it('should handle check constraint violation', () => {
      const error: any = {
        code: '23514',
        message: 'check constraint violation'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Data violates database constraints',
        error_code: 'CONSTRAINT_VIOLATION'
      });
    });
  });

  describe('Multer errors', () => {
    it('should handle file size limit error', () => {
      const error: any = {
        code: 'LIMIT_FILE_SIZE',
        message: 'File too large'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'File too large. Maximum size is 10MB.',
        error_code: 'FILE_TOO_LARGE'
      });
    });

    it('should handle unexpected file field error', () => {
      const error: any = {
        code: 'LIMIT_UNEXPECTED_FILE',
        message: 'Unexpected field'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Unexpected file field. Expected field name: "file"',
        error_code: 'INVALID_FILE_FIELD'
      });
    });

    it('should handle invalid file type error', () => {
      const error: any = {
        message: 'Only CSV files are allowed'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid file type. Only CSV files are allowed.',
        error_code: 'INVALID_FILE_TYPE'
      });
    });
  });

  describe('Service errors', () => {
    it('should handle Redis errors', () => {
      const error: any = {
        message: 'Redis connection failed'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        message: 'Rate limiting service temporarily unavailable',
        error_code: 'REDIS_ERROR'
      });
    });

    it('should handle Kafka errors', () => {
      const error: any = {
        message: 'Kafka producer error'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        message: 'Event publishing service temporarily unavailable',
        error_code: 'KAFKA_ERROR'
      });
    });

    it('should handle database connection errors', () => {
      const error: any = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable',
        error_code: 'DATABASE_ERROR'
      });
    });
  });

  describe('Default error handling', () => {
    it('should handle unknown errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const error = new Error('Unknown error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again later.',
        error_code: 'INTERNAL_ERROR'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should include debug info in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const error: any = new Error('Debug error');
      error.stack = 'Error stack trace';

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again later.',
        error_code: 'INTERNAL_ERROR',
        debug: {
          message: 'Debug error',
          stack: 'Error stack trace'
        }
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});

