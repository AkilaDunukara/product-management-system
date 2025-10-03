/**
 * Authentication middleware for X-Seller-Id header validation
 * This is a simplified authentication approach for demo purposes
 */
const authMiddleware = (req, res, next) => {
    const sellerId = req.headers['x-seller-id'];
  
    // Check if X-Seller-Id header is present
    if (!sellerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'X-Seller-Id header required',
        error_code: 'MISSING_SELLER_ID'
      });
    }
  
    // Validate seller ID format (seller-{alphanumeric})
    if (!/^seller-[a-zA-Z0-9]+$/.test(sellerId)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid seller identifier format. Expected: seller-{id}',
        error_code: 'INVALID_SELLER_ID'
      });
    }
  
    // Additional validation: check length
    if (sellerId.length > 50) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Seller ID too long. Maximum 50 characters.',
        error_code: 'SELLER_ID_TOO_LONG'
      });
    }
  
    // Attach seller ID to request object for use in routes
    req.sellerId = sellerId;
    next();
  };
  
  module.exports = authMiddleware;


