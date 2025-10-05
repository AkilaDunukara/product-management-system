const mockConnect = jest.fn();
const mockSubscribe = jest.fn();
const mockRun = jest.fn();
const mockDisconnect = jest.fn();
const mockConsumer = jest.fn();
const mockSaveNotification = jest.fn();
const mockPublishNotification = jest.fn();

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(() => ({
    consumer: mockConsumer,
  })),
}));

jest.mock('../src/storage/dynamodb', () => ({
  saveNotification: mockSaveNotification,
}));

jest.mock('../src/pubsub/redis', () => ({
  publishNotification: mockPublishNotification,
}));

describe('Kafka Consumer', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockConnect.mockResolvedValue(undefined);
    mockSubscribe.mockResolvedValue(undefined);
    mockRun.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);

    mockConsumer.mockReturnValue({
      connect: mockConnect,
      subscribe: mockSubscribe,
      run: mockRun,
      disconnect: mockDisconnect,
    });

    mockSaveNotification.mockResolvedValue(undefined);
    mockPublishNotification.mockResolvedValue(undefined);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    jest.resetModules();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('startConsumer', () => {
    it('should connect to Kafka', async () => {
      const { startConsumer } = require('../src/consumer');
      
      await startConsumer();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('[Consumer] Connected to Kafka');
    });

    it('should subscribe to all required topics', async () => {
      const { startConsumer } = require('../src/consumer');
      
      await startConsumer();

      expect(mockSubscribe).toHaveBeenCalledWith({
        topics: ['product.created', 'product.updated', 'product.deleted', 'product.lowstock'],
        fromBeginning: false,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Consumer] Subscribed to topics');
    });

    it('should start consumer with message handler', async () => {
      const { startConsumer } = require('../src/consumer');
      
      await startConsumer();

      expect(mockRun).toHaveBeenCalledWith({
        eachMessage: expect.any(Function),
      });
    });
  });

  describe('stopConsumer', () => {
    it('should disconnect from Kafka', async () => {
      const { stopConsumer } = require('../src/consumer');
      
      await stopConsumer();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('[Consumer] Disconnected from Kafka');
    });
  });

  describe('message processing', () => {
    let eachMessageHandler: Function;

    beforeEach(async () => {
      const { startConsumer } = require('../src/consumer');
      await startConsumer();
      eachMessageHandler = mockRun.mock.calls[0][0].eachMessage;
    });

    it('should process ProductCreated event', async () => {
      const message = {
        topic: 'product.created',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify({
            eventId: 'seller-123-456-ProductCreated-1696176000000',
            eventType: 'ProductCreated',
            timestamp: 1696176000000,
            data: {
              productId: 456,
              sellerId: 'seller-123',
              name: 'Test Product',
              price: 29.99,
              quantity: 100,
              category: 'Test',
            },
          })),
        },
      };

      await eachMessageHandler(message);

      expect(mockSaveNotification).toHaveBeenCalled();
      expect(mockPublishNotification).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Consumer] Processing ProductCreated')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Consumer] Successfully processed event')
      );
    });

    it('should process ProductUpdated event', async () => {
      const message = {
        topic: 'product.updated',
        partition: 1,
        message: {
          value: Buffer.from(JSON.stringify({
            eventId: 'seller-456-789-ProductUpdated-1696176060000',
            eventType: 'ProductUpdated',
            timestamp: 1696176060000,
            data: {
              productId: 789,
              sellerId: 'seller-456',
              name: 'Updated Product',
              price: 39.99,
              quantity: 50,
              category: 'Test',
              changes: {
                price: { old: 29.99, new: 39.99 },
              },
            },
          })),
        },
      };

      await eachMessageHandler(message);

      expect(mockSaveNotification).toHaveBeenCalled();
      expect(mockPublishNotification).toHaveBeenCalled();
    });

    it('should process ProductDeleted event', async () => {
      const message = {
        topic: 'product.deleted',
        partition: 2,
        message: {
          value: Buffer.from(JSON.stringify({
            eventId: 'seller-789-111-ProductDeleted-1696176120000',
            eventType: 'ProductDeleted',
            timestamp: 1696176120000,
            data: {
              productId: 111,
              sellerId: 'seller-789',
              name: 'Deleted Product',
              category: 'Test',
              deletedAt: '2025-10-02T10:32:00Z',
            },
          })),
        },
      };

      await eachMessageHandler(message);

      expect(mockSaveNotification).toHaveBeenCalled();
      expect(mockPublishNotification).toHaveBeenCalled();
    });

    it('should process LowStockWarning event', async () => {
      const message = {
        topic: 'product.lowstock',
        partition: 3,
        message: {
          value: Buffer.from(JSON.stringify({
            eventId: 'seller-999-222-LowStockWarning-1696176030000',
            eventType: 'LowStockWarning',
            timestamp: 1696176030000,
            data: {
              productId: 222,
              sellerId: 'seller-999',
              name: 'Low Stock Product',
              quantity: 5,
              threshold: 10,
              category: 'Test',
              price: 19.99,
            },
          })),
        },
      };

      await eachMessageHandler(message);

      expect(mockSaveNotification).toHaveBeenCalled();
      expect(mockPublishNotification).toHaveBeenCalled();
    });

    it('should handle empty message', async () => {
      const message = {
        topic: 'product.created',
        partition: 0,
        message: {
          value: null,
        },
      };

      await eachMessageHandler(message);

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Consumer] Empty message received');
      expect(mockSaveNotification).not.toHaveBeenCalled();
      expect(mockPublishNotification).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const message = {
        topic: 'product.created',
        partition: 0,
        message: {
          value: Buffer.from('invalid json'),
        },
      };

      await expect(eachMessageHandler(message)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Consumer] Failed to process message:',
        expect.any(Error)
      );
    });

    it('should handle unknown event type', async () => {
      const message = {
        topic: 'product.created',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify({
            eventId: 'test-unknown',
            eventType: 'UnknownEvent',
            timestamp: Date.now(),
            data: {},
          })),
        },
      };

      await expect(eachMessageHandler(message)).rejects.toThrow('Unknown event type');
    });

    it('should retry on failure with exponential backoff', async () => {
      mockSaveNotification
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(undefined);

      const message = {
        topic: 'product.created',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify({
            eventId: 'retry-test',
            eventType: 'ProductCreated',
            timestamp: Date.now(),
            data: {
              productId: 1,
              sellerId: 'seller-1',
              name: 'Test',
              price: 10.0,
              quantity: 1,
              category: 'Test',
            },
          })),
        },
      };

      const handlerPromise = eachMessageHandler(message);
      
      await jest.advanceTimersByTimeAsync(500);
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);
      
      await handlerPromise;

      expect(mockSaveNotification).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[Retry] Attempt'));
    });

    it('should fail after max retries', async () => {
      mockSaveNotification.mockRejectedValue(new Error('Persistent failure'));

      const message = {
        topic: 'product.created',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify({
            eventId: 'fail-test',
            eventType: 'ProductCreated',
            timestamp: Date.now(),
            data: {
              productId: 1,
              sellerId: 'seller-1',
              name: 'Test',
              price: 10.0,
              quantity: 1,
              category: 'Test',
            },
          })),
        },
      };

      const handlerPromise = eachMessageHandler(message).catch((e: Error) => e);
      
      for (let i = 0; i < 6; i++) {
        await jest.advanceTimersByTimeAsync(10000);
      }
      
      const result = await handlerPromise;
      expect(result.message).toBe('Persistent failure');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Retry] Max retries')
      );
    });
  });
});
