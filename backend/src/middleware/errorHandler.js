/**
 * Global error handling middleware
 * Handles different types of errors and returns consistent error responses
 */
const errorHandler = (err, req, res, next) => {
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
    return res.status(400).json({
      error: 'Bad Request',
      message: `Validation error: ${err.details[0].message}`,
      error_code: 'VALIDATION_ERROR',
      details: {
        field: err.details[0].path.join('.'),
        constraint: err.details[0].type,
        value: err.details[0].context?.value
      }
    });
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
      error_code: 'DUPLICATE_RESOURCE'
    });
  }

  if (err.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid reference to related resource',
      error_code: 'INVALID_REFERENCE'
    });
  }

  if (err.code === '23514') { // Check constraint violation
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Data violates database constraints',
      error_code: 'CONSTRAINT_VIOLATION'
    });
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'File too large. Maximum size is 10MB.',
      error_code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Unexpected file field. Expected field name: "file"',
      error_code: 'INVALID_FILE_FIELD'
    });
  }

  if (err.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid file type. Only CSV files are allowed.',
      error_code: 'INVALID_FILE_TYPE'
    });
  }

  // Redis connection errors
  if (err.message && err.message.includes('Redis')) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Rate limiting service temporarily unavailable',
      error_code: 'REDIS_ERROR'
    });
  }

  // Kafka errors
  if (err.message && err.message.includes('Kafka')) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Event publishing service temporarily unavailable',
      error_code: 'KAFKA_ERROR'
    });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database service temporarily unavailable',
      error_code: 'DATABASE_ERROR'
    });
  }

  // Default server error
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

module.exports = errorHandler;
