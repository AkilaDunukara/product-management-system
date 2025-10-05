import { handleProductUpdated } from '../../src/handlers/productUpdated';
import { ProductUpdatedEvent } from '../../src/types';

describe('handleProductUpdated', () => {
  it('should transform ProductUpdated event to notification with changes', () => {
    const event: ProductUpdatedEvent = {
      eventId: 'seller-123-456-ProductUpdated-1696176060000',
      eventType: 'ProductUpdated',
      timestamp: 1696176060000,
      data: {
        productId: 456,
        sellerId: 'seller-123',
        name: 'Wireless Mouse Pro',
        description: 'Enhanced ergonomic wireless mouse',
        price: 34.99,
        quantity: 120,
        category: 'Electronics',
        createdAt: '2025-10-02T10:30:00Z',
        updatedAt: '2025-10-02T10:31:00Z',
        changes: {
          name: {
            old: 'Wireless Mouse',
            new: 'Wireless Mouse Pro',
          },
          price: {
            old: 29.99,
            new: 34.99,
          },
          quantity: {
            old: 150,
            new: 120,
          },
        },
      },
    };

    const notification = handleProductUpdated(event);

    expect(notification).toEqual({
      id: 'seller-123-456-ProductUpdated-1696176060000',
      sellerId: 'seller-123',
      type: 'ProductUpdated',
      message: 'Product updated: Wireless Mouse Pro (name, price, quantity changed)',
      data: {
        productId: 456,
        name: 'Wireless Mouse Pro',
        category: 'Electronics',
        price: 34.99,
        quantity: 120,
        changes: {
          name: { old: 'Wireless Mouse', new: 'Wireless Mouse Pro' },
          price: { old: 29.99, new: 34.99 },
          quantity: { old: 150, new: 120 },
        },
      },
      timestamp: 1696176060000,
      read: false,
    });
  });

  it('should handle update without changes field', () => {
    const event: ProductUpdatedEvent = {
      eventId: 'seller-789-222-ProductUpdated-1696176060001',
      eventType: 'ProductUpdated',
      timestamp: 1696176060001,
      data: {
        productId: 222,
        sellerId: 'seller-789',
        name: 'Updated Product',
        price: 50.00,
        quantity: 10,
        category: 'Test',
      },
    };

    const notification = handleProductUpdated(event);

    expect(notification.message).toBe('Product updated: Updated Product (fields changed)');
    expect(notification.data.changes).toBeUndefined();
  });

  it('should handle single field change', () => {
    const event: ProductUpdatedEvent = {
      eventId: 'seller-456-789-ProductUpdated-1696176060002',
      eventType: 'ProductUpdated',
      timestamp: 1696176060002,
      data: {
        productId: 789,
        sellerId: 'seller-456',
        name: 'Product X',
        price: 100.00,
        quantity: 5,
        category: 'Electronics',
        changes: {
          quantity: {
            old: 25,
            new: 5,
          },
        },
      },
    };

    const notification = handleProductUpdated(event);

    expect(notification.message).toBe('Product updated: Product X (quantity changed)');
  });
});

