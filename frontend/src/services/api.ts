import axios, { AxiosResponse } from 'axios';
import { env } from '../config/env';
import type {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductListResponse,
  ProductFilters,
  ImportResponse,
  SSEEvent
} from '../types';

const API_BASE_URL = env.api.baseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: env.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const sellerId = localStorage.getItem('sellerId');
  if (sellerId) {
    config.headers['X-Seller-Id'] = sellerId;
  }
  return config;
});

export const productService = {
  getProducts: (params: ProductFilters = {}): Promise<AxiosResponse<ProductListResponse>> => 
    api.get('/products', { params }),
  
  getProduct: (id: number): Promise<AxiosResponse<Product>> => 
    api.get(`/products/${id}`),
  
  createProduct: (data: ProductCreateRequest): Promise<AxiosResponse<Product>> => 
    api.post('/products', data),
  
  updateProduct: (id: number, data: ProductUpdateRequest): Promise<AxiosResponse<Product>> => 
    api.put(`/products/${id}`, data),
  
  deleteProduct: (id: number): Promise<AxiosResponse<{ message: string; deleted_id: number }>> => 
    api.delete(`/products/${id}`),
  
  importProducts: (
    file: File, 
    onProgress?: (percent: number) => void
  ): Promise<AxiosResponse<ImportResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      }
    });
  }
};

export const createSSEConnection = (
  sellerId: string,
  onMessage: (data: SSEEvent) => void,
  onError?: (error: Event) => void
): EventSource => {
  const eventSource = new EventSource(`${API_BASE_URL}/events/stream?sellerId=${sellerId}`);

  eventSource.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  };

  const handleEvent = (eventType: string) => (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      onMessage({ ...data, eventType });
    } catch (error) {
      console.error(`Failed to parse ${eventType} event:`, error);
    }
  };

  eventSource.addEventListener('ProductCreated', handleEvent('ProductCreated'));
  eventSource.addEventListener('ProductUpdated', handleEvent('ProductUpdated'));
  eventSource.addEventListener('ProductDeleted', handleEvent('ProductDeleted'));
  eventSource.addEventListener('LowStockWarning', handleEvent('LowStockWarning'));

  eventSource.onerror = (error: Event) => {
    console.error('SSE connection error:', error);
    if (onError) onError(error);
  };

  return eventSource;
};

export default api;
