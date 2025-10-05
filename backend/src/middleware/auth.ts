import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware for X-Seller-Id header validation
 * This is a simplified authentication approach for demo purposes
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const sellerId = (req.headers['x-seller-id'] as string) || (req.query.sellerId as string);

  // Check if X-Seller-Id header or sellerId query parameter is present
  if (!sellerId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'X-Seller-Id header or sellerId query parameter required',
      error_code: 'MISSING_SELLER_ID'
    });
    return;
  }

  // Validate seller ID format (seller-{alphanumeric})
  if (!/^seller-[a-zA-Z0-9]+$/.test(sellerId)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid seller identifier format. Expected: seller-{id}',
      error_code: 'INVALID_SELLER_ID'
    });
    return;
  }

  // Additional validation: check length
  if (sellerId.length > 50) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Seller ID too long. Maximum 50 characters.',
      error_code: 'SELLER_ID_TOO_LONG'
    });
    return;
  }

  // Attach seller ID to request object for use in routes
  req.sellerId = sellerId;
  next();
};

export default authMiddleware;
