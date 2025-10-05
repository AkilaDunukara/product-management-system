const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockAxiosInstance),
  },
}));

import { productService, createSSEConnection } from '../../src/services/api';
import type { ProductCreateRequest, ProductUpdateRequest } from '../../src/types';

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem = jest.fn();
  });

  describe('getProducts', () => {
    it('should fetch products with filters', async () => {
      const mockResponse = { data: { data: [], pagination: {} } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await productService.getProducts({ category: 'Electronics' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products', {
        params: { category: 'Electronics' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch products without filters', async () => {
      const mockResponse = { data: { data: [], pagination: {} } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await productService.getProducts();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products', { params: {} });
    });
  });

  describe('getProduct', () => {
    it('should fetch single product by id', async () => {
      const mockProduct = { id: 1, name: 'Test Product' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockProduct });

      const result = await productService.getProduct(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products/1');
      expect(result.data).toEqual(mockProduct);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData: ProductCreateRequest = {
        name: 'New Product',
        price: 19.99,
        quantity: 100,
        category: 'Electronics',
      };

      const mockResponse = { data: { id: 1, ...productData } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await productService.createProduct(productData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/products', productData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updateData: ProductUpdateRequest = {
        name: 'Updated Product',
        price: 29.99,
      };

      const mockResponse = { data: { id: 1, ...updateData } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await productService.updateProduct(1, updateData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/products/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockResponse = { data: { message: 'Deleted', deleted_id: 1 } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await productService.deleteProduct(1);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/products/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('importProducts', () => {
    it('should upload CSV file', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const mockResponse = {
        data: { message: 'Import started', import_id: 'import-123', status: 'processing' },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await productService.importProducts(file);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/products/import',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should call onProgress callback during upload', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const onProgress = jest.fn();
      const mockResponse = {
        data: { message: 'Import started', import_id: 'import-123', status: 'processing' },
      };

      mockAxiosInstance.post.mockImplementation((url, data, config) => {
        if (config.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 });
        }
        return Promise.resolve(mockResponse);
      });

      await productService.importProducts(file, onProgress);

      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });
});

describe('createSSEConnection', () => {
  let mockEventSource: any;

  beforeEach(() => {
    mockEventSource = {
      addEventListener: jest.fn(),
      onmessage: null,
      onerror: null,
    };

    global.EventSource = jest.fn(() => mockEventSource) as any;
  });

  it('should create EventSource with correct URL', () => {
    const onMessage = jest.fn();
    createSSEConnection('seller-123', onMessage);

    expect(global.EventSource).toHaveBeenCalledWith(
      expect.stringContaining('sellerId=seller-123')
    );
  });

  it('should handle onmessage events', () => {
    const onMessage = jest.fn();
    createSSEConnection('seller-123', onMessage);

    const messageEvent = {
      data: JSON.stringify({ id: 1, message: 'Test message' }),
    };

    mockEventSource.onmessage(messageEvent);

    expect(onMessage).toHaveBeenCalledWith({ id: 1, message: 'Test message' });
  });

  it('should handle JSON parse errors in onmessage', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onMessage = jest.fn();
    createSSEConnection('seller-123', onMessage);

    const messageEvent = { data: 'invalid json' };
    mockEventSource.onmessage(messageEvent);

    expect(onMessage).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should register event listeners for specific event types', () => {
    const onMessage = jest.fn();
    createSSEConnection('seller-123', onMessage);

    expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
      'ProductCreated',
      expect.any(Function)
    );
    expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
      'ProductUpdated',
      expect.any(Function)
    );
    expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
      'ProductDeleted',
      expect.any(Function)
    );
    expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
      'LowStockWarning',
      expect.any(Function)
    );
  });

  it('should handle specific event types', () => {
    const onMessage = jest.fn();
    createSSEConnection('seller-123', onMessage);

    const productCreatedHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'ProductCreated'
    )[1];

    const event = {
      data: JSON.stringify({ id: 1, message: 'Product created' }),
    };

    productCreatedHandler(event);

    expect(onMessage).toHaveBeenCalledWith({
      id: 1,
      message: 'Product created',
      eventType: 'ProductCreated',
    });
  });

  it('should handle onerror events', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onMessage = jest.fn();
    const onError = jest.fn();

    createSSEConnection('seller-123', onMessage, onError);

    const errorEvent = new Event('error');
    mockEventSource.onerror(errorEvent);

    expect(onError).toHaveBeenCalledWith(errorEvent);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle onerror without callback', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const onMessage = jest.fn();

    createSSEConnection('seller-123', onMessage);

    const errorEvent = new Event('error');
    mockEventSource.onerror(errorEvent);

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});