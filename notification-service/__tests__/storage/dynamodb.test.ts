import { Notification } from '../../src/types';

const mockSend = jest.fn();
const mockFrom = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: mockFrom,
  },
  PutCommand: jest.fn((input) => ({ input })),
}));

describe('DynamoDB Storage', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSend.mockResolvedValue({});
    mockFrom.mockReturnValue({
      send: mockSend,
    });
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.resetModules();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should save notification to DynamoDB', async () => {
    const { saveNotification } = require('../../src/storage/dynamodb');
    
    const notification: Notification = {
      id: 'seller-123-456-ProductCreated-1696176000000',
      sellerId: 'seller-123',
      type: 'ProductCreated',
      message: 'New product created: Test Product',
      data: {
        productId: 456,
        name: 'Test Product',
        category: 'Test',
        price: 29.99,
        quantity: 100,
      },
      timestamp: 1696176000000,
      read: false,
    };

    await saveNotification(notification);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.TableName).toBe('notifications');
    expect(putCommand.input.Item.id).toBe(notification.id);
    expect(putCommand.input.Item.sellerId).toBe(notification.sellerId);
    expect(putCommand.input.Item.type).toBe(notification.type);
    expect(putCommand.input.Item.message).toBe(notification.message);
    expect(putCommand.input.Item.read).toBe(false);
  });

  it('should add TTL (30 days) to notification', async () => {
    const { saveNotification } = require('../../src/storage/dynamodb');
    
    const notification: Notification = {
      id: 'test-id',
      sellerId: 'seller-1',
      type: 'ProductCreated',
      message: 'Test',
      data: {},
      timestamp: Date.now(),
      read: false,
    };

    const beforeTime = Math.floor(Date.now() / 1000);
    await saveNotification(notification);
    const afterTime = Math.floor(Date.now() / 1000);

    const putCommand = mockSend.mock.calls[0][0];
    const ttl = putCommand.input.Item.ttl;
    
    const expectedMinTTL = beforeTime + 30 * 24 * 60 * 60;
    const expectedMaxTTL = afterTime + 30 * 24 * 60 * 60;
    
    expect(ttl).toBeGreaterThanOrEqual(expectedMinTTL);
    expect(ttl).toBeLessThanOrEqual(expectedMaxTTL);
  });

  it('should log success message after saving', async () => {
    const { saveNotification } = require('../../src/storage/dynamodb');
    
    const notification: Notification = {
      id: 'test-notification-id',
      sellerId: 'seller-test',
      type: 'ProductUpdated',
      message: 'Test notification',
      data: {},
      timestamp: Date.now(),
      read: false,
    };

    await saveNotification(notification);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[DynamoDB] Saved notification: test-notification-id'
    );
  });

  it('should handle DynamoDB errors', async () => {
    const { saveNotification } = require('../../src/storage/dynamodb');
    
    const error = new Error('DynamoDB error');
    mockSend.mockRejectedValueOnce(error);

    const notification: Notification = {
      id: 'error-test',
      sellerId: 'seller-1',
      type: 'ProductCreated',
      message: 'Test',
      data: {},
      timestamp: Date.now(),
      read: false,
    };

    await expect(saveNotification(notification)).rejects.toThrow('DynamoDB error');
  });

  it('should preserve all notification data fields', async () => {
    const { saveNotification } = require('../../src/storage/dynamodb');
    
    const notification: Notification = {
      id: 'complex-id',
      sellerId: 'seller-999',
      type: 'LowStockWarning',
      message: 'Low stock alert',
      data: {
        productId: 123,
        quantity: 5,
        threshold: 10,
        additionalInfo: { warning: true },
      },
      timestamp: 1696176000000,
      read: false,
    };

    await saveNotification(notification);

    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.Item.data).toEqual(notification.data);
    expect(putCommand.input.Item.timestamp).toBe(notification.timestamp);
  });
});

