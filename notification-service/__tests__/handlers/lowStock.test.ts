import { handleLowStock } from '../../src/handlers/lowStock';
import { LowStockWarningEvent } from '../../src/types';

describe('handleLowStock', () => {
  it('should transform LowStockWarning event to notification', () => {
    const event: LowStockWarningEvent = {
      eventId: 'seller-456-67890-LowStockWarning-1696176030000',
      eventType: 'LowStockWarning',
      timestamp: 1696176030000,
      data: {
        productId: 67890,
        sellerId: 'seller-456',
        name: 'USB-C Cable',
        quantity: 8,
        threshold: 10,
        category: 'Accessories',
        price: 12.99,
        previousQuantity: 8,
      },
    };

    const notification = handleLowStock(event);

    expect(notification).toEqual({
      id: 'seller-456-67890-LowStockWarning-1696176030000',
      sellerId: 'seller-456',
      type: 'LowStockWarning',
      message: 'Low stock alert: USB-C Cable (8 left)',
      data: {
        productId: 67890,
        name: 'USB-C Cable',
        category: 'Accessories',
        quantity: 8,
        threshold: 10,
        price: 12.99,
        previousQuantity: 8,
      },
      timestamp: 1696176030000,
      read: false,
    });
  });

  it('should handle zero quantity', () => {
    const event: LowStockWarningEvent = {
      eventId: 'seller-123-11111-LowStockWarning-1696176200000',
      eventType: 'LowStockWarning',
      timestamp: 1696176200000,
      data: {
        productId: 11111,
        sellerId: 'seller-123',
        name: 'Limited Edition Widget',
        quantity: 0,
        threshold: 10,
        category: 'Collectibles',
        price: 199.99,
        previousQuantity: 3,
      },
    };

    const notification = handleLowStock(event);

    expect(notification.message).toBe('Low stock alert: Limited Edition Widget (0 left)');
    expect(notification.data.quantity).toBe(0);
  });

  it('should include threshold and price information', () => {
    const event: LowStockWarningEvent = {
      eventId: 'test-low-stock',
      eventType: 'LowStockWarning',
      timestamp: 1696176200001,
      data: {
        productId: 999,
        sellerId: 'seller-999',
        name: 'Test Product',
        quantity: 5,
        threshold: 10,
        category: 'Test',
        price: 49.99,
      },
    };

    const notification = handleLowStock(event);

    expect(notification.data.threshold).toBe(10);
    expect(notification.data.price).toBe(49.99);
    expect(notification.data.previousQuantity).toBeUndefined();
  });

  it('should handle different quantity levels', () => {
    const quantities = [0, 1, 5, 9];
    
    quantities.forEach((qty) => {
      const event: LowStockWarningEvent = {
        eventId: `test-${qty}`,
        eventType: 'LowStockWarning',
        timestamp: Date.now(),
        data: {
          productId: 1,
          sellerId: 'seller-1',
          name: 'Product',
          quantity: qty,
          threshold: 10,
          category: 'Test',
          price: 10.0,
        },
      };

      const notification = handleLowStock(event);
      
      expect(notification.message).toBe(`Low stock alert: Product (${qty} left)`);
    });
  });
});

