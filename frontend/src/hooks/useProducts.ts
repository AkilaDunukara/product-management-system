import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/api';
import { env } from '../config/env';
import type { Product, ProductFilters, Pagination, ProductCreateRequest, ProductUpdateRequest } from '../types';

interface UseProductsOptions {
  initialFilters?: ProductFilters;
  initialPage?: number;
  initialLimit?: number;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  createProduct: (data: ProductCreateRequest) => Promise<Product>;
  updateProduct: (id: number, data: ProductUpdateRequest) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const {
    initialFilters = { category: '', sort_by: 'created_at', sort_order: 'desc' },
    initialPage = 1,
    initialLimit = env.pagination.defaultPageSize
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    total_pages: 0
  });
  const [filters, setFiltersState] = useState<ProductFilters>(initialFilters);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      setProducts(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (data: ProductCreateRequest): Promise<Product> => {
    const response = await productService.createProduct(data);
    await fetchProducts();
    return response.data;
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: number, data: ProductUpdateRequest): Promise<Product> => {
    const response = await productService.updateProduct(id, data);
    await fetchProducts();
    return response.data;
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: number): Promise<void> => {
    await productService.deleteProduct(id);
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refresh,
    createProduct,
    updateProduct,
    deleteProduct
  };
};
