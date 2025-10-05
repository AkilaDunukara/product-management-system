import { DynamoDBStorage } from '../../src/storage/dynamodb';
import { SellerMetrics, CategoryMetrics, LowStockMetrics } from '../../src/types';

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({})
    }))
  },
  PutCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn()
}));

describe('DynamoDBStorage', () => {
  let storage: DynamoDBStorage;

  beforeEach(() => {
    storage = new DynamoDBStorage();
  });

  it('should save seller metrics', async () => {
    const metrics = new Map<string, SellerMetrics>([
      ['seller-1', {
        sellerId: 'seller-1',
        totalProducts: 10,
        activeProducts: 8,
        deletedProducts: 2,
        totalValue: 1000,
        lastUpdated: Date.now()
      }]
    ]);

    await expect(storage.saveSellerMetrics(metrics)).resolves.not.toThrow();
  });

  it('should save category metrics', async () => {
    const metrics = new Map<string, CategoryMetrics>([
      ['Electronics', {
        category: 'Electronics',
        totalProducts: 5,
        totalValue: 500,
        averagePrice: 100,
        lastUpdated: Date.now()
      }]
    ]);

    await expect(storage.saveCategoryMetrics(metrics)).resolves.not.toThrow();
  });

  it('should save low stock metrics', async () => {
    const metrics: LowStockMetrics = {
      lowStockCount: 2,
      products: [
        {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Product A',
          quantity: 5,
          category: 'Electronics'
        }
      ],
      lastUpdated: Date.now()
    };

    await expect(storage.saveLowStockMetrics(metrics)).resolves.not.toThrow();
  });

  it('should save all metrics', async () => {
    const sellerMetrics = new Map<string, SellerMetrics>();
    const categoryMetrics = new Map<string, CategoryMetrics>();
    const lowStockMetrics: LowStockMetrics = {
      lowStockCount: 0,
      products: [],
      lastUpdated: Date.now()
    };

    await expect(
      storage.saveAllMetrics(sellerMetrics, categoryMetrics, lowStockMetrics)
    ).resolves.not.toThrow();
  });
});
