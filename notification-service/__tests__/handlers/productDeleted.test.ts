import { handleProductDeleted } from '../../src/handlers/productDeleted';
import { ProductDeletedEvent } from '../../src/types';

describe('handleProductDeleted', () => {
  it('should transform ProductDeleted event to notification', () => {
    const event: ProductDeletedEvent = {
      eventId: 'seller-123-456-ProductDeleted-1696176120000',
      eventType: 'ProductDeleted',
      timestamp: 1696176120000,
      data: {
        productId: 456,
        sellerId: 'seller-123',
        name: 'Wireless Mouse Pro',
        category: 'Electronics',
        deletedAt: '2025-10-02T10:32:00Z',
      },
    };

    const notification = handleProductDeleted(event);

    expect(notification).toEqual({
      id: 'seller-123-456-ProductDeleted-1696176120000',
      sellerId: 'seller-123',
      type: 'ProductDeleted',
      message: 'Product deleted: Wireless Mouse Pro',
      data: {
        productId: 456,
        name: 'Wireless Mouse Pro',
        category: 'Electronics',
        deletedAt: '2025-10-02T10:32:00Z',
      },
      timestamp: 1696176120000,
      read: false,
    });
  });

  it('should handle deletion with different product names', () => {
    const event: ProductDeletedEvent = {
      eventId: 'seller-999-111-ProductDeleted-1696176120001',
      eventType: 'ProductDeleted',
      timestamp: 1696176120001,
      data: {
        productId: 111,
        sellerId: 'seller-999',
        name: 'Discontinued Widget',
        category: 'Legacy',
        deletedAt: '2025-10-02T10:32:30Z',
      },
    };

    const notification = handleProductDeleted(event);

    expect(notification.message).toBe('Product deleted: Discontinued Widget');
    expect(notification.data.deletedAt).toBe('2025-10-02T10:32:30Z');
  });

  it('should always set read to false', () => {
    const event: ProductDeletedEvent = {
      eventId: 'test-id',
      eventType: 'ProductDeleted',
      timestamp: 1696176120002,
      data: {
        productId: 1,
        sellerId: 'seller-1',
        name: 'Test Product',
        category: 'Test',
        deletedAt: '2025-10-02T10:00:00Z',
      },
    };

    const notification = handleProductDeleted(event);

    expect(notification.read).toBe(false);
  });
});

