export interface Product {
  id: number;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ProductCreateData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
}

export interface ProductFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  min_quantity?: number;
  max_quantity?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ImportResult {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

export interface KafkaEvent {
  eventId: string;
  eventType: string;
  timestamp: number;
  data: any;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

declare global {
  namespace Express {
    interface Request {
      sellerId: string;
    }
  }
}
