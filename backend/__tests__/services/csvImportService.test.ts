import csvImportService from '../../src/services/csvImportService';
import productRepository from '../../src/repositories/productRepository';
import { publishEvent } from '../../src/config/kafka';
import { ProductCreateData } from '../../src/types';

// Mock dependencies
jest.mock('../../src/repositories/productRepository');
jest.mock('../../src/config/kafka');

const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;
const mockPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>;

/**
 * CSV Import Service Tests
 * Test suite for CSV streaming import and batch processing
 */
describe('CsvImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LOW_STOCK_THRESHOLD = '10';
  });

  afterEach(() => {
    delete process.env.LOW_STOCK_THRESHOLD;
  });

  describe('processImport', () => {
    it('should process valid CSV data successfully', async () => {
      const sellerId = 'seller-123';
      const csvData = 'name,description,price,quantity,category\nProduct 1,Description 1,99.99,50,Electronics\nProduct 2,Description 2,49.99,25,Books';
      const fileBuffer = Buffer.from(csvData);

      const mockProducts: any[] = [
        { id: 1, name: 'Product 1', seller_id: sellerId },
        { id: 2, name: 'Product 2', seller_id: sellerId }
      ];

      mockProductRepository.batchInsert.mockResolvedValue(mockProducts);
      mockPublishEvent.mockResolvedValue();

      const result = await csvImportService.processImport(sellerId, fileBuffer);

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle validation errors', async () => {
      const sellerId = 'seller-123';
      const csvData = 'name,description,price,quantity,category\n,Description 1,99.99,50,Electronics\nProduct 2,Description 2,-10,25,Books';
      const fileBuffer = Buffer.from(csvData);

      const result = await csvImportService.processImport(sellerId, fileBuffer);

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should process in batches for large datasets', async () => {
      const sellerId = 'seller-123';
      const csvRows = Array.from({ length: 1500 }, (_, i) => 
        `Product ${i + 1},Description ${i + 1},99.99,50,Electronics`
      );
      const csvData = 'name,description,price,quantity,category\n' + csvRows.join('\n');
      const fileBuffer = Buffer.from(csvData);

      const mockProducts: any[] = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}` }));
      mockProductRepository.batchInsert.mockResolvedValue(mockProducts);
      mockPublishEvent.mockResolvedValue();

      const result = await csvImportService.processImport(sellerId, fileBuffer);

      expect(mockProductRepository.batchInsert).toHaveBeenCalledTimes(2);
      expect(result.processed).toBe(1500);
    });
  });

  describe('processBatch', () => {
    it('should insert products and publish events', async () => {
      const sellerId = 'seller-123';
      const products: ProductCreateData[] = [
        { name: 'Product 1', price: 99.99, quantity: 50, category: 'Electronics' },
        { name: 'Product 2', price: 49.99, quantity: 25, category: 'Books' }
      ];

      const mockInsertedProducts: any[] = [
        { id: 1, seller_id: sellerId, ...products[0] },
        { id: 2, seller_id: sellerId, ...products[1] }
      ];

      mockProductRepository.batchInsert.mockResolvedValue(mockInsertedProducts);

      const result = await (csvImportService as any).processBatch(sellerId, products);

      expect(mockProductRepository.batchInsert).toHaveBeenCalledWith(sellerId, products);
      expect(result).toBe(2);
    });
  });

  describe('publishBatchEvents', () => {
    it('should publish batch created events', async () => {
      const products: any[] = [
        { id: 1, seller_id: 'seller-123', name: 'Product 1', price: '99.99', quantity: 50, category: 'Electronics' },
        { id: 2, seller_id: 'seller-123', name: 'Product 2', price: '49.99', quantity: 25, category: 'Books' }
      ];

      mockPublishEvent.mockResolvedValue();

      await (csvImportService as any).publishBatchEvents(products);

      expect(mockPublishEvent).toHaveBeenCalledWith('product.created', expect.objectContaining({
        eventType: 'ProductCreated',
        data: expect.objectContaining({
          sellerId: 'seller-123',
          batchSize: 2
        })
      }));
    });

    it('should publish low stock warnings', async () => {
      const products: any[] = [
        { id: 1, seller_id: 'seller-123', name: 'Low Stock Product', price: '99.99', quantity: 5, category: 'Electronics' }
      ];

      mockPublishEvent.mockResolvedValue();

      await (csvImportService as any).publishBatchEvents(products);

      expect(mockPublishEvent).toHaveBeenCalledWith('product.lowstock', expect.objectContaining({
        eventType: 'LowStockWarning',
        data: expect.objectContaining({
          productId: 1,
          quantity: 5
        })
      }));
    });
  });

  describe('validateHeaders', () => {
    it('should validate required headers', () => {
      const validHeaders = ['name', 'description', 'price', 'quantity', 'category'];
      
      expect(() => csvImportService.validateHeaders(validHeaders)).not.toThrow();
    });

    it('should throw error for missing headers', () => {
      const invalidHeaders = ['name', 'description', 'price'];
      
      expect(() => csvImportService.validateHeaders(invalidHeaders))
        .toThrow('Missing required CSV headers: quantity, category');
    });
  });

  describe('getImportStatus', () => {
    it('should return import status', async () => {
      const importId = 'import-123';
      
      const result = await csvImportService.getImportStatus(importId);
      
      expect(result).toEqual({
        import_id: importId,
        status: 'completed',
        message: 'Import status tracking not yet implemented'
      });
    });
  });

  describe('cancelImport', () => {
    it('should return cancellation status', async () => {
      const importId = 'import-123';
      
      const result = await csvImportService.cancelImport(importId);
      
      expect(result).toEqual({
        import_id: importId,
        status: 'cancelled',
        message: 'Import cancellation not yet implemented'
      });
    });
  });
});

