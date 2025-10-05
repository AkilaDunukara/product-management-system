import { S3Archive } from '../../src/storage/s3';
import { SellerMetrics, CategoryMetrics, LowStockMetrics } from '../../src/types';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({})
  })),
  PutObjectCommand: jest.fn()
}));

describe('S3Archive', () => {
  let archive: S3Archive;

  beforeEach(() => {
    archive = new S3Archive();
  });

  it('should archive metrics to S3', async () => {
    const sellerMetrics = new Map<string, SellerMetrics>([
      ['seller-1', {
        sellerId: 'seller-1',
        totalProducts: 10,
        activeProducts: 8,
        deletedProducts: 2,
        totalValue: 1000,
        lastUpdated: Date.now()
      }]
    ]);

    const categoryMetrics = new Map<string, CategoryMetrics>([
      ['Electronics', {
        category: 'Electronics',
        totalProducts: 5,
        totalValue: 500,
        averagePrice: 100,
        lastUpdated: Date.now()
      }]
    ]);

    const lowStockMetrics: LowStockMetrics = {
      lowStockCount: 1,
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

    await expect(
      archive.archiveMetrics(sellerMetrics, categoryMetrics, lowStockMetrics)
    ).resolves.not.toThrow();
  });
});
