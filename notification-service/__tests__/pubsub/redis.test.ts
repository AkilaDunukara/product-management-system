import { Notification } from '../../src/types';

const mockConnect = jest.fn();
const mockPublish = jest.fn();
const mockQuit = jest.fn();
const mockOn = jest.fn();

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: mockConnect,
    publish: mockPublish,
    quit: mockQuit,
    on: mockOn,
  })),
}));

describe('Redis Pub/Sub', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockConnect.mockResolvedValue(undefined);
    mockPublish.mockResolvedValue(1);
    mockQuit.mockResolvedValue(undefined);
    mockOn.mockReturnValue(undefined);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    jest.resetModules();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('connectRedis', () => {
    it('should connect to Redis', async () => {
      const { connectRedis } = require('../../src/pubsub/redis');
      
      await connectRedis();
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const { connectRedis } = require('../../src/pubsub/redis');
      
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error);

      await expect(connectRedis()).rejects.toThrow('Connection failed');
    });
  });

  describe('publishNotification', () => {
    it('should publish notification to correct channel', async () => {
      const { publishNotification } = require('../../src/pubsub/redis');
      
      const notification: Notification = {
        id: 'test-id',
        sellerId: 'seller-123',
        type: 'ProductCreated',
        message: 'Test notification',
        data: { productId: 456 },
        timestamp: Date.now(),
        read: false,
      };

      await publishNotification(notification);

      expect(mockPublish).toHaveBeenCalledWith(
        'notifications:seller-123',
        JSON.stringify(notification)
      );
    });

    it('should log published message', async () => {
      const { publishNotification } = require('../../src/pubsub/redis');
      
      const notification: Notification = {
        id: 'test-id',
        sellerId: 'seller-456',
        type: 'ProductUpdated',
        message: 'Update notification',
        data: {},
        timestamp: Date.now(),
        read: false,
      };

      await publishNotification(notification);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Redis] Published to notifications:seller-456: ProductUpdated'
      );
    });

    it('should serialize notification data correctly', async () => {
      const { publishNotification } = require('../../src/pubsub/redis');
      
      const notification: Notification = {
        id: 'complex-id',
        sellerId: 'seller-789',
        type: 'LowStockWarning',
        message: 'Low stock',
        data: {
          productId: 123,
          quantity: 5,
          nested: { field: 'value' },
        },
        timestamp: 1696176000000,
        read: false,
      };

      await publishNotification(notification);

      const publishedData = mockPublish.mock.calls[0][1];
      const parsed = JSON.parse(publishedData);
      
      expect(parsed).toEqual(notification);
      expect(parsed.data.nested.field).toBe('value');
    });

    it('should handle different seller IDs', async () => {
      const { publishNotification } = require('../../src/pubsub/redis');
      
      const sellerIds = ['seller-1', 'seller-999', 'seller-abc-123'];

      for (const sellerId of sellerIds) {
        const notification: Notification = {
          id: `${sellerId}-notification`,
          sellerId,
          type: 'ProductCreated',
          message: 'Test',
          data: {},
          timestamp: Date.now(),
          read: false,
        };

        await publishNotification(notification);

        expect(mockPublish).toHaveBeenCalledWith(
          `notifications:${sellerId}`,
          expect.any(String)
        );
      }
    });

    it('should handle publish errors', async () => {
      const { publishNotification } = require('../../src/pubsub/redis');
      
      const error = new Error('Publish failed');
      mockPublish.mockRejectedValueOnce(error);

      const notification: Notification = {
        id: 'error-test',
        sellerId: 'seller-1',
        type: 'ProductCreated',
        message: 'Test',
        data: {},
        timestamp: Date.now(),
        read: false,
      };

      await expect(publishNotification(notification)).rejects.toThrow('Publish failed');
    });
  });

  describe('disconnectRedis', () => {
    it('should disconnect from Redis', async () => {
      const { disconnectRedis } = require('../../src/pubsub/redis');
      
      await disconnectRedis();
      expect(mockQuit).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect errors', async () => {
      const { disconnectRedis } = require('../../src/pubsub/redis');
      
      const error = new Error('Disconnect failed');
      mockQuit.mockRejectedValueOnce(error);

      await expect(disconnectRedis()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('Redis event handlers', () => {
    it('should register error and connect handlers', () => {
      require('../../src/pubsub/redis');
      
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
    });
  });
});
