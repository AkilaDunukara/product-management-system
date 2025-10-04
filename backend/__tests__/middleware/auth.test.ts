import { Request, Response, NextFunction } from 'express';
import authMiddleware from '../../src/middleware/auth';

/**
 * Auth Middleware Tests
 * Test suite for X-Seller-Id header validation
 */
describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('valid seller ID', () => {
    it('should pass with valid seller ID format', () => {
      req.headers = { 'x-seller-id': 'seller-abc123' };

      authMiddleware(req as Request, res as Response, next);

      expect((req as any).sellerId).toBe('seller-abc123');
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass with alphanumeric seller ID', () => {
      req.headers = { 'x-seller-id': 'seller-ABC123def456' };

      authMiddleware(req as Request, res as Response, next);

      expect((req as any).sellerId).toBe('seller-ABC123def456');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('missing seller ID', () => {
    it('should return 401 when X-Seller-Id header is missing', () => {
      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'X-Seller-Id header required',
        error_code: 'MISSING_SELLER_ID'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when X-Seller-Id header is empty', () => {
      req.headers = { 'x-seller-id': '' };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'X-Seller-Id header required',
        error_code: 'MISSING_SELLER_ID'
      });
    });
  });

  describe('invalid seller ID format', () => {
    it('should return 401 for invalid format without seller- prefix', () => {
      req.headers = { 'x-seller-id': 'abc123' };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid seller identifier format. Expected: seller-{id}',
        error_code: 'INVALID_SELLER_ID'
      });
    });

    it('should return 401 for format with special characters', () => {
      req.headers = { 'x-seller-id': 'seller-abc@123' };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid seller identifier format. Expected: seller-{id}',
        error_code: 'INVALID_SELLER_ID'
      });
    });

    it('should return 401 for format with spaces', () => {
      req.headers = { 'x-seller-id': 'seller-abc 123' };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid seller identifier format. Expected: seller-{id}',
        error_code: 'INVALID_SELLER_ID'
      });
    });
  });

  describe('seller ID length validation', () => {
    it('should return 401 for seller ID longer than 50 characters', () => {
      req.headers = { 'x-seller-id': 'seller-' + 'a'.repeat(45) }; // 52 characters total

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Seller ID too long. Maximum 50 characters.',
        error_code: 'SELLER_ID_TOO_LONG'
      });
    });

    it('should pass for seller ID exactly 50 characters', () => {
      req.headers = { 'x-seller-id': 'seller-' + 'a'.repeat(43) }; // 50 characters total

      authMiddleware(req as Request, res as Response, next);

      expect((req as any).sellerId).toBe('seller-' + 'a'.repeat(43));
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});

