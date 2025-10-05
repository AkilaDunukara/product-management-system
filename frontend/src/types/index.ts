export interface Product {
  id: number;
  seller_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: string;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProductListResponse {
  data: Product[];
  pagination: Pagination;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  min_quantity?: number;
  max_quantity?: number;
  sort_by?: 'name' | 'price' | 'quantity' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ImportResponse {
  message: string;
  import_id: string;
  status: 'processing';
}

export interface Notification {
  id: string | number;
  type: 'ProductCreated' | 'ProductUpdated' | 'ProductDeleted' | 'LowStockWarning' | 'info';
  message: string;
  data?: {
    productId?: number;
    name?: string;
    quantity?: number;
    [key: string]: any;
  };
  timestamp: number;
}

export interface SSEEvent {
  id?: string;
  type?: string;
  eventType?: string;
  message?: string;
  data?: any;
  timestamp?: number;
}

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ErrorResponse {
  error: string;
  message: string;
  error_code?: string;
  details?: any;
}
