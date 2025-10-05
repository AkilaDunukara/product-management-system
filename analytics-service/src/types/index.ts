/**
 * Product event from Kafka topic
 */
export interface ProductEvent {
  eventId: string;
  eventType: 'ProductCreated' | 'ProductUpdated' | 'ProductDeleted';
  timestamp: number;
  data: ProductData;
}

/**
 * Product data payload within events
 */
export interface ProductData {
  productId: number;
  sellerId: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  changes?: {
    [key: string]: {
      old: any;
      new: any;
    };
  };
}

/**
 * Aggregated metrics per seller
 */
export interface SellerMetrics {
  sellerId: string;
  totalProducts: number;
  activeProducts: number;
  deletedProducts: number;
  totalValue: number;
  lastUpdated: number;
}

/**
 * Aggregated metrics per category
 */
export interface CategoryMetrics {
  category: string;
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
  lastUpdated: number;
}

/**
 * Metrics for products with low stock levels
 */
export interface LowStockMetrics {
  lowStockCount: number;
  products: Array<{
    productId: number;
    sellerId: string;
    name: string;
    quantity: number;
    category: string;
  }>;
  lastUpdated: number;
}

/**
 * Combined aggregated metrics
 */
export interface AggregatedMetrics {
  sellerMetrics: Map<string, SellerMetrics>;
  categoryMetrics: Map<string, CategoryMetrics>;
  lowStockMetrics: LowStockMetrics;
}

/**
 * Message sent to worker thread
 */
export interface WorkerMessage {
  type: 'process';
  events: ProductEvent[];
}

/**
 * Result returned from worker thread
 */
export interface WorkerResult {
  type: 'result';
  metrics: {
    sellerMetrics: [string, SellerMetrics][];
    categoryMetrics: [string, CategoryMetrics][];
    lowStockMetrics: LowStockMetrics;
  };
  error?: string;
}

/**
 * Configuration for retry logic with exponential backoff
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}
