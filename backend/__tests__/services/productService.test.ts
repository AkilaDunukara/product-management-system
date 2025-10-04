import productService from '../../src/services/productService';
import productRepository from '../../src/repositories/productRepository';
import { publishEvent } from '../../src/config/kafka';
import { ProductCreateData, ProductUpdateData } from '../../src/types';

// Mock dependencies
jest.mock('../../src/repositories/productRepository');
jest.mock('../../src/config/kafka');

const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;
const mockPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>;

/**
 * Product Service Tests
 * Test suite for product business logic and event publishing
 */
describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LOW_STOCK_THRESHOLD = '10';
  });

  afterEach(() => {
    delete process.env.LOW_STOCK_THRESHOLD;
  });

  describe('createProduct', () => {
    it('should create product and publish events', async () => {
      const sellerId = 'seller-123';
      const productData: ProductCreateData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        quantity: 50,
        category: 'Electronics'
      };

      const mockProduct: any = {
        id: 1,
        seller_id: sellerId,
        ...productData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockProductRepository.create.mockResolvedValue(mockProduct);
      mockPublishEvent.mockResolvedValue();

      const result = await productService.createProduct(sellerId, productData);

      expect(mockProductRepository.create).toHaveBeenCalledWith(sellerId, productData);
      expect(mockPublishEvent).toHaveBeenCalledWith('product.created', expect.objectContaining({
        eventType: 'ProductCreated',
        data: expect.objectContaining({
          productId: 1,
          sellerId: sellerId
        })
      }));
      expect(result).toMatchObject({
        id: 1,
        seller_id: sellerId,
        name: 'Test Product',
        price: 99.99
      });
    });

    it('should publish low stock warning for products below threshold', async () => {
      const sellerId = 'seller-123';
      const productData: ProductCreateData = {
        name: 'Low Stock Product',
        quantity: 5,
        price: 50.00,
        category: 'Test'
      };

      const mockProduct: any = {
        id: 1,
        seller_id: sellerId,
        ...productData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockProductRepository.create.mockResolvedValue(mockProduct);
      mockPublishEvent.mockResolvedValue();

      await productService.createProduct(sellerId, productData);

      expect(mockPublishEvent).toHaveBeenCalledWith('product.lowstock', expect.objectContaining({
        eventType: 'LowStockWarning',
        data: expect.objectContaining({
          productId: 1,
          quantity: 5
        })
      }));
    });

    it('should handle Kafka publish errors gracefully', async () => {
      const sellerId = 'seller-123';
      const productData: ProductCreateData = {
        name: 'Test Product',
        price: 99.99,
        quantity: 50,
        category: 'Electronics'
      };

      const mockProduct: any = {
        id: 1,
        seller_id: sellerId,
        ...productData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockProductRepository.create.mockResolvedValue(mockProduct);
      mockPublishEvent.mockRejectedValue(new Error('Kafka error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await productService.createProduct(sellerId, productData);

      expect(result).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getProducts', () => {
    it('should return paginated products with metadata', async () => {
      const sellerId = 'seller-123';
      const filters = { page: 1, limit: 20 };
      const mockProducts: any[] = [
        { id: 1, name: 'Product 1', price: 99.99, quantity: 10, category: 'Test', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Product 2', price: 49.99, quantity: 20, category: 'Test', created_at: new Date(), updated_at: new Date() }
      ];

      mockProductRepository.findBySeller.mockResolvedValue(mockProducts);
      mockProductRepository.countBySeller.mockResolvedValue(25);

      const result = await productService.getProducts(sellerId, filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 25,
        total_pages: 2
      });
    });
  });

  describe('getProductById', () => {
    it('should return formatted product when found', async () => {
      const sellerId = 'seller-123';
      const productId = 1;
      const mockProduct: any = {
        id: productId,
        seller_id: sellerId,
        name: 'Test Product',
        price: '99.99',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockProductRepository.findByIdAndSeller.mockResolvedValue(mockProduct);

      const result = await productService.getProductById(sellerId, productId);

      expect(result).toMatchObject({
        id: productId,
        seller_id: sellerId,
        name: 'Test Product',
        price: 99.99
      });
    });

    it('should return null when product not found', async () => {
      const sellerId = 'seller-123';
      const productId = 999;

      mockProductRepository.findByIdAndSeller.mockResolvedValue(null);

      const result = await productService.getProductById(sellerId, productId);

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('should update product and publish events', async () => {
      const sellerId = 'seller-123';
      const productId = 1;
      const updateData: ProductUpdateData = { name: 'Updated Product', quantity: 15 };
      
      const currentProduct: any = {
        id: productId,
        seller_id: sellerId,
        name: 'Old Product',
        price: 99.99,
        quantity: 20,
        category: 'Test',
        created_at: new Date(),
        updated_at: new Date()
      };

      const updatedProduct: any = {
        ...currentProduct,
        ...updateData,
        updated_at: new Date()
      };

      mockProductRepository.updateByIdAndSeller.mockResolvedValue({
        current: currentProduct,
        updated: updatedProduct
      });
      mockPublishEvent.mockResolvedValue();

      const result = await productService.updateProduct(sellerId, productId, updateData);

      expect(mockProductRepository.updateByIdAndSeller).toHaveBeenCalledWith(productId, sellerId, updateData);
      expect(mockPublishEvent).toHaveBeenCalledWith('product.updated', expect.objectContaining({
        eventType: 'ProductUpdated'
      }));
      expect(result!.name).toBe('Updated Product');
    });

    it('should return null when product not found', async () => {
      const sellerId = 'seller-123';
      const productId = 999;
      const updateData: ProductUpdateData = { name: 'Updated Product' };

      mockProductRepository.updateByIdAndSeller.mockResolvedValue({
        current: null,
        updated: null
      });

      const result = await productService.updateProduct(sellerId, productId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and publish event', async () => {
      const sellerId = 'seller-123';
      const productId = 1;
      const mockProduct: any = {
        id: productId,
        seller_id: sellerId,
        name: 'Test Product',
        price: 99.99,
        quantity: 10,
        category: 'Test',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date()
      };

      mockProductRepository.deleteByIdAndSeller.mockResolvedValue(mockProduct);
      mockPublishEvent.mockResolvedValue();

      const result = await productService.deleteProduct(sellerId, productId);

      expect(mockProductRepository.deleteByIdAndSeller).toHaveBeenCalledWith(productId, sellerId);
      expect(mockPublishEvent).toHaveBeenCalledWith('product.deleted', expect.objectContaining({
        eventType: 'ProductDeleted'
      }));
      expect(result).toEqual({ deleted_id: productId });
    });

    it('should return null when product not found', async () => {
      const sellerId = 'seller-123';
      const productId = 999;

      mockProductRepository.deleteByIdAndSeller.mockResolvedValue(null);

      const result = await productService.deleteProduct(sellerId, productId);

      expect(result).toBeNull();
    });
  });

  describe('formatProduct', () => {
    it('should format product data correctly', () => {
      const mockProduct: any = {
        id: 1,
        seller_id: 'seller-123',
        name: 'Test Product',
        description: 'Test Description',
        price: '99.99',
        quantity: 50,
        category: 'Electronics',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02')
      };

      const result = (productService as any).formatProduct(mockProduct);

      expect(result).toEqual({
        id: 1,
        seller_id: 'seller-123',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        quantity: 50,
        category: 'Electronics',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02')
      });
    });
  });
});

