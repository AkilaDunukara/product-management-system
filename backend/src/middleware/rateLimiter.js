const { getRedisClient } = require('../config/redis');

/**
 * Redis-based rate limiter using sliding window algorithm
 * Supports different limits for standard and bulk operations
 */
const rateLimiter = async (req, res, next) => {
  try {
    const sellerId = req.headers['x-seller-id'];
    
    // Skip rate limiting if no seller ID (will be caught by auth middleware)
    if (!sellerId) {
      return next();
    }

    const redis = getRedisClient();
    const now = Date.now();
    
    // Determine rate limits based on endpoint
    const isBulkOperation = req.path.includes('/import');
    const limit = isBulkOperation 
      ? parseInt(process.env.RATE_LIMIT_BULK || '5') 
      : parseInt(process.env.RATE_LIMIT_STANDARD || '100');
    
    const windowSize = isBulkOperation ? 60000 : 1000; // 1 minute for bulk, 1 second for standard
    
    const key = `rate_limit:${sellerId}:${isBulkOperation ? 'bulk' : 'standard'}`;
    const windowStart = now - windowSize;

    // Remove old entries from sorted set
    await redis.zRemRangeByScore(key, '-inf', windowStart);
    
    // Count current requests in window
    const currentCount = await redis.zCard(key);

    // Check if limit exceeded
    if (currentCount >= limit) {
      const resetTime = Math.ceil((now + windowSize) / 1000);
      
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': Math.ceil(windowSize / 1000).toString()
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${limit} requests per ${isBulkOperation ? 'minute' : 'second'} per seller.`,
        error_code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit,
          window: isBulkOperation ? '1m' : '1s',
          retry_after: Math.ceil(windowSize / 1000)
        }
      });
    }

    // Add current request to sliding window
    const requestId = `${now}-${Math.random().toString(36).substr(2, 9)}`;
    await redis.zAdd(key, { score: now, value: requestId });
    
    // Set expiration for cleanup
    await redis.expire(key, Math.ceil(windowSize / 1000) + 1);

    // Set rate limit headers
    const remaining = Math.max(0, limit - currentCount - 1);
    const resetTime = Math.ceil((now + windowSize) / 1000);

    res.set({
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString()
    });

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Continue on rate limiter error to avoid blocking requests
    next();
  }
};

module.exports = rateLimiter;
