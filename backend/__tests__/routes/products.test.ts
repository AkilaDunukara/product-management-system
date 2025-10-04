import request from 'supertest';
import express, { Express } from 'express';
import productsRouter from '../../src/routes/products';
import productService from '../../src/services/productService';
import csvImportService from '../../src/services/csvImportService';
import errorHandler from '../../src/middleware/errorHandler';

// Mock services
jest.mock('../../src/services/productService');
jest.mock('../../src/services/csvImportService');

const mockProductService = productService as jest.Mocked<typeof productService>;
const mockCsvImportService = csvImportService as jest.Mocked<typeof csvImportService>;

/**
 * Products Routes Tests
 * Test suite for product REST API endpoints
 */
describe('Products Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      (req as any).sellerId = 'seller-123';
      next();
    });
    app.use('/products', productsRouter);
    app.use(errorHandler);
    jest.clearAllMocks();
  });

  describe('POST /products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        quantity: 50,
        category: 'Electronics'
      };

      const mockProduct: any = { id: 1, seller_id: 'seller-123', ...productData };
      mockProductService.createProduct.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/products')
        .send(productData)
        .expect(201);

      expect(response.body).toEqual(mockProduct);
      expect(mockProductService.createProduct).toHaveBeenCalledWith('seller-123', productData);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        price: -10,
        quantity: 'invalid' as any
      };

      const response = await request(app)
        .post('/products')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('GET /products', () => {
    it('should return paginated products', async () => {
      const mockResult: any = {
        data: [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1
        }
      };

      mockProductService.getProducts.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/products')
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockProductService.getProducts).toHaveBeenCalledWith('seller-123', { 
        page: 1, 
        limit: 20, 
        sort_by: 'created_at', 
        sort_order: 'desc' 
      });
    });

    it('should handle query validation errors', async () => {
      const response = await request(app)
        .get('/products')
        .query({ page: 0, limit: 200 })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('GET /products/:id', () => {
    it('should return a specific product', async () => {
      const mockProduct: any = { id: 1, name: 'Test Product', seller_id: 'seller-123' };
      mockProductService.getProductById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/products/1')
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(mockProductService.getProductById).toHaveBeenCalledWith('seller-123', 1);
    });

    it('should return 404 for non-existent product', async () => {
      mockProductService.getProductById.mockResolvedValue(null);

      const response = await request(app)
        .get('/products/999')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.error_code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .get('/products/invalid')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.error_code).toBe('INVALID_PRODUCT_ID');
    });
  });

  describe('PUT /products/:id', () => {
    it('should update a product', async () => {
      const updateData = { name: 'Updated Product', price: 149.99 };
      const mockProduct: any = { id: 1, seller_id: 'seller-123', ...updateData };
      mockProductService.updateProduct.mockResolvedValue(mockProduct);

      const response = await request(app)
        .put('/products/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(mockProductService.updateProduct).toHaveBeenCalledWith('seller-123', 1, updateData);
    });

    it('should return 404 for non-existent product', async () => {
      mockProductService.updateProduct.mockResolvedValue(null);

      const response = await request(app)
        .put('/products/999')
        .send({ name: 'Updated Product' })
        .expect(404);

      expect(response.body.error_code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product', async () => {
      mockProductService.deleteProduct.mockResolvedValue({ deleted_id: 1 });

      const response = await request(app)
        .delete('/products/1')
        .expect(200);

      expect(response.body.message).toBe('Product deleted successfully');
      expect(response.body.deleted_id).toBe(1);
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('seller-123', 1);
    });

    it('should return 404 for non-existent product', async () => {
      mockProductService.deleteProduct.mockResolvedValue(null);

      const response = await request(app)
        .delete('/products/999')
        .expect(404);

      expect(response.body.error_code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /products/import', () => {
    it('should accept CSV import', async () => {
      const csvData = 'name,description,price,quantity,category\nProduct 1,Description 1,99.99,50,Electronics';
      mockCsvImportService.processImport.mockResolvedValue({
        processed: 1,
        successful: 1,
        failed: 0,
        errors: []
      });

      const response = await request(app)
        .post('/products/import')
        .attach('file', Buffer.from(csvData), 'test.csv')
        .expect(202);

      expect(response.body.message).toBe('Import accepted and processing');
      expect(response.body.status).toBe('processing');
      expect(response.body.import_id).toMatch(/^import-seller-123-\d+$/);
    });

    it('should return 400 when no file provided', async () => {
      const response = await request(app)
        .post('/products/import')
        .expect(400);

      expect(response.body.error_code).toBe('MISSING_FILE');
    });
  });
});

