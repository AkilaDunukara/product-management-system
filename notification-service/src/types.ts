export interface BaseEvent {
  eventId: string;
  eventType: 'ProductCreated' | 'ProductUpdated' | 'ProductDeleted' | 'LowStockWarning';
  timestamp: number;
  data: any;
}

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
}

export interface ProductCreatedEvent extends BaseEvent {
  eventType: 'ProductCreated';
  data: ProductData;
}

export interface ProductUpdatedEvent extends BaseEvent {
  eventType: 'ProductUpdated';
  data: ProductData & {
    changes?: {
      name?: { old: string | null; new: string };
      description?: { old: string | null; new: string | null };
      price?: { old: number; new: number };
      quantity?: { old: number; new: number };
      category?: { old: string | null; new: string };
    };
  };
}

export interface ProductDeletedEvent extends BaseEvent {
  eventType: 'ProductDeleted';
  data: {
    productId: number;
    sellerId: string;
    name: string;
    category: string;
    deletedAt: string;
  };
}

export interface LowStockWarningEvent extends BaseEvent {
  eventType: 'LowStockWarning';
  data: {
    productId: number;
    sellerId: string;
    name: string;
    quantity: number;
    threshold: number;
    category: string;
    price: number;
    previousQuantity?: number;
  };
}

export type ProductEvent = ProductCreatedEvent | ProductUpdatedEvent | ProductDeletedEvent | LowStockWarningEvent;

export interface Notification {
  id: string;
  sellerId: string;
  type: string;
  message: string;
  data: any;
  timestamp: number;
  read: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  initialRetryDelayMs: number;
  backoffMultiplier: number;
  maxRetryDelayMs: number;
}

