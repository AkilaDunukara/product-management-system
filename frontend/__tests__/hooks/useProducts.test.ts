import { renderHook, act, waitFor } from '@testing-library/react';
import { useProducts } from '../../src/hooks/useProducts';
import { productService } from '../../src/services/api';
import type { Product, ProductListResponse } from '../../src/types';

jest.mock('../../src/services/api');

describe('useProducts', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      seller_id: 'seller-123',
      name: 'Product 1',
      description: 'Description 1',
      price: 10.99,
      quantity: 100,
      category: 'Electronics',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockResponse: ProductListResponse = {
    data: mockProducts,
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    },
  };

  beforeEach(() => {
    (productService.getProducts as jest.Mock).mockResolvedValue({ data: mockResponse });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch products on mount', async () => {
    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
  });

  it('should handle fetch errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (productService.getProducts as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.products).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it('should set filters and reset to page 1', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ category: 'Electronics', sort_by: 'price', sort_order: 'asc' });
    });

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Electronics',
          sort_by: 'price',
          sort_order: 'asc',
        })
      );
    });
  });

  it('should change page', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('should create product', async () => {
    const newProduct: Product = { ...mockProducts[0], id: 2, name: 'New Product' };
    (productService.createProduct as jest.Mock).mockResolvedValue({ data: newProduct });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdProduct: Product | undefined;
    await act(async () => {
      createdProduct = await result.current.createProduct({
        name: 'New Product',
        price: 20.99,
        quantity: 50,
        category: 'Electronics',
      });
    });

    expect(createdProduct).toEqual(newProduct);
    expect(productService.createProduct).toHaveBeenCalled();
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
  });

  it('should update product', async () => {
    const updatedProduct: Product = { ...mockProducts[0], name: 'Updated Product' };
    (productService.updateProduct as jest.Mock).mockResolvedValue({ data: updatedProduct });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: Product | undefined;
    await act(async () => {
      updated = await result.current.updateProduct(1, { name: 'Updated Product' });
    });

    expect(updated).toEqual(updatedProduct);
    expect(productService.updateProduct).toHaveBeenCalledWith(1, { name: 'Updated Product' });
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
  });

  it('should delete product', async () => {
    (productService.deleteProduct as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteProduct(1);
    });

    expect(productService.deleteProduct).toHaveBeenCalledWith(1);
    expect(productService.getProducts).toHaveBeenCalledTimes(2);
  });

  it('should refresh products', async () => {
    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(productService.getProducts).toHaveBeenCalledTimes(2);
  });

  it('should use initial options', async () => {
    const { result } = renderHook(() =>
      useProducts({
        initialFilters: { category: 'Books', sort_by: 'name', sort_order: 'asc' },
        initialPage: 2,
        initialLimit: 50,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(productService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 50,
        category: 'Books',
        sort_by: 'name',
        sort_order: 'asc',
      })
    );
  });
});
