import { Request, Response, NextFunction } from 'express';
import rateLimiter from '../../src/middleware/rateLimiter';
import { getRedisClient } from '../../src/config/redis';

// Mock Redis client
jest.mock('../../src/config/redis');

/**
 * Rate Limiter Middleware Tests
 * Test suite for Redis-based sliding window rate limiting
 */
describe('Rate Limiter Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockRedis: any;

  beforeEach(() => {
    req = {
      headers: { 'x-seller-id': 'seller-123' },
      path: '/products'
    } as Partial<Request>;
    res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    mockRedis = {
      zRemRangeByScore: jest.fn().mockResolvedValue(undefined),
      zCard: jest.fn().mockResolvedValue(0),
      zAdd: jest.fn().mockResolvedValue(undefined),
      expire: jest.fn().mockResolvedValue(undefined)
    };

    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
    process.env.RATE_LIMIT_STANDARD = '100';
    process.env.RATE_LIMIT_BULK = '5';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.RATE_LIMIT_STANDARD;
    delete process.env.RATE_LIMIT_BULK;
  });

  describe('standard operations', () => {
    it('should allow requests under limit', async () => {
      mockRedis.zCard.mockResolvedValue(50);

      await rateLimiter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '49',
        'X-RateLimit-Reset': expect.any(String)
      });
    });

    it('should block requests over limit', async () => {
      mockRedis.zCard.mockResolvedValue(100);

      await rateLimiter(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Maximum 100 requests per second per seller.',
        error_code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: 100,
          window: '1s',
          retry_after: 1
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('bulk operations', () => {
    beforeEach(() => {
      req = {
        headers: { 'x-seller-id': 'seller-123' },
        path: '/products/import'
      } as Partial<Request>;
    });

    it('should use bulk limits for import endpoints', async () => {
      mockRedis.zCard.mockResolvedValue(2);

      await rateLimiter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '2',
        'X-RateLimit-Reset': expect.any(String)
      });
    });

    it('should block bulk requests over limit', async () => {
      mockRedis.zCard.mockResolvedValue(5);

      await rateLimiter(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Maximum 5 requests per minute per seller.',
        error_code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: 5,
          window: '1m',
          retry_after: 60
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should skip rate limiting when no seller ID', async () => {
      req.headers = {};

      await rateLimiter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(mockRedis.zCard).not.toHaveBeenCalled();
    });

    it('should continue on Redis errors', async () => {
      mockRedis.zCard.mockRejectedValue(new Error('Redis error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await rateLimiter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('sliding window management', () => {
    it('should clean up old entries', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await rateLimiter(req as Request, res as Response, next);

      expect(mockRedis.zRemRangeByScore).toHaveBeenCalledWith(
        'rate_limit:seller-123:standard',
        '-inf',
        now - 1000
      );

      (Date.now as jest.Mock).mockRestore();
    });

    it('should add current request to window', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      await rateLimiter(req as Request, res as Response, next);

      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        'rate_limit:seller-123:standard',
        { score: now, value: expect.any(String) }
      );

      (Date.now as jest.Mock).mockRestore();
      (Math.random as jest.Mock).mockRestore();
    });

    it('should set expiration for cleanup', async () => {
      await rateLimiter(req as Request, res as Response, next);

      expect(mockRedis.expire).toHaveBeenCalledWith(
        'rate_limit:seller-123:standard',
        2
      );
    });
  });
});

