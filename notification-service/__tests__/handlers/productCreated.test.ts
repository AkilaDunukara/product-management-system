import { handleProductCreated } from '../../src/handlers/productCreated';
import { ProductCreatedEvent } from '../../src/types';

describe('handleProductCreated', () => {
  it('should transform ProductCreated event to notification', () => {
    const event: ProductCreatedEvent = {
      eventId: 'seller-123-456-ProductCreated-1696176000000',
      eventType: 'ProductCreated',
      timestamp: 1696176000000,
      data: {
        productId: 456,
        sellerId: 'seller-123',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 29.99,
        quantity: 150,
        category: 'Electronics',
        createdAt: '2025-10-02T10:30:00Z',
        updatedAt: '2025-10-02T10:30:00Z',
      },
    };

    const notification = handleProductCreated(event);

    expect(notification).toEqual({
      id: 'seller-123-456-ProductCreated-1696176000000',
      sellerId: 'seller-123',
      type: 'ProductCreated',
      message: 'New product created: Wireless Mouse',
      data: {
        productId: 456,
        name: 'Wireless Mouse',
        category: 'Electronics',
        price: 29.99,
        quantity: 150,
      },
      timestamp: 1696176000000,
      read: false,
    });
  });

  it('should handle product with minimal data', () => {
    const event: ProductCreatedEvent = {
      eventId: 'seller-999-111-ProductCreated-1696176000001',
      eventType: 'ProductCreated',
      timestamp: 1696176000001,
      data: {
        productId: 111,
        sellerId: 'seller-999',
        name: 'Simple Product',
        price: 10.00,
        quantity: 1,
        category: 'Other',
      },
    };

    const notification = handleProductCreated(event);

    expect(notification.id).toBe('seller-999-111-ProductCreated-1696176000001');
    expect(notification.sellerId).toBe('seller-999');
    expect(notification.message).toBe('New product created: Simple Product');
    expect(notification.read).toBe(false);
  });

  it('should preserve event timestamp', () => {
    const timestamp = Date.now();
    const event: ProductCreatedEvent = {
      eventId: 'test-event-id',
      eventType: 'ProductCreated',
      timestamp,
      data: {
        productId: 1,
        sellerId: 'seller-1',
        name: 'Test Product',
        price: 1.0,
        quantity: 1,
        category: 'Test',
      },
    };

    const notification = handleProductCreated(event);

    expect(notification.timestamp).toBe(timestamp);
  });
});

