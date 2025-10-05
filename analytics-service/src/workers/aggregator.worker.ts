import { parentPort } from 'worker_threads';
import { WorkerMessage, WorkerResult, ProductEvent, SellerMetrics, CategoryMetrics, LowStockMetrics } from '../types';

const LOW_STOCK_THRESHOLD = 10;

/**
 * Aggregates product events into seller, category, and low stock metrics
 * Runs in a worker thread to avoid blocking the main event loop
 */
function aggregateMetrics(events: ProductEvent[]) {
  const sellerMetrics = new Map<string, SellerMetrics>();
  const categoryMetrics = new Map<string, CategoryMetrics>();
  const lowStockProducts = new Map<number, { productId: number; sellerId: string; name: string; quantity: number; category: string }>();

  for (const event of events) {
    const { eventType, timestamp, data } = event;
    const { sellerId, category, price, quantity, productId, name } = data;

    // Initialize seller metrics if not exists
    if (!sellerMetrics.has(sellerId)) {
      sellerMetrics.set(sellerId, {
        sellerId,
        totalProducts: 0,
        activeProducts: 0,
        deletedProducts: 0,
        totalValue: 0,
        lastUpdated: timestamp
      });
    }

    const sellerMetric = sellerMetrics.get(sellerId)!;
    sellerMetric.lastUpdated = Math.max(sellerMetric.lastUpdated, timestamp);

    // Update seller metrics based on event type
    if (eventType === 'ProductCreated') {
      sellerMetric.totalProducts++;
      sellerMetric.activeProducts++;
      sellerMetric.totalValue += price * quantity;
    } else if (eventType === 'ProductUpdated') {
      if (data.changes?.price || data.changes?.quantity) {
        const oldPrice = data.changes?.price?.old ?? price;
        const oldQuantity = data.changes?.quantity?.old ?? quantity;
        sellerMetric.totalValue -= oldPrice * oldQuantity;
        sellerMetric.totalValue += price * quantity;
      }
    } else if (eventType === 'ProductDeleted') {
      sellerMetric.activeProducts--;
      sellerMetric.deletedProducts++;
    }

    // Initialize category metrics if not exists
    if (!categoryMetrics.has(category)) {
      categoryMetrics.set(category, {
        category,
        totalProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        lastUpdated: timestamp
      });
    }

    const categoryMetric = categoryMetrics.get(category)!;
    categoryMetric.lastUpdated = Math.max(categoryMetric.lastUpdated, timestamp);

    // Update category metrics based on event type
    if (eventType === 'ProductCreated') {
      categoryMetric.totalProducts++;
      categoryMetric.totalValue += price * quantity;
    } else if (eventType === 'ProductUpdated') {
      if (data.changes?.price || data.changes?.quantity) {
        const oldPrice = data.changes?.price?.old ?? price;
        const oldQuantity = data.changes?.quantity?.old ?? quantity;
        categoryMetric.totalValue -= oldPrice * oldQuantity;
        categoryMetric.totalValue += price * quantity;
      }
    } else if (eventType === 'ProductDeleted') {
      categoryMetric.totalProducts--;
    }

    // Calculate average price for category
    if (categoryMetric.totalProducts > 0) {
      categoryMetric.averagePrice = categoryMetric.totalValue / categoryMetric.totalProducts;
    }

    // Track low stock products
    if (eventType !== 'ProductDeleted' && quantity < LOW_STOCK_THRESHOLD) {
      lowStockProducts.set(productId, { productId, sellerId, name, quantity, category });
    } else if (eventType === 'ProductDeleted') {
      lowStockProducts.delete(productId);
    }
  }

  const lowStockMetrics: LowStockMetrics = {
    lowStockCount: lowStockProducts.size,
    products: Array.from(lowStockProducts.values()),
    lastUpdated: Date.now()
  };

  return {
    sellerMetrics: Array.from(sellerMetrics.entries()),
    categoryMetrics: Array.from(categoryMetrics.entries()),
    lowStockMetrics
  };
}

// Worker thread message handler
if (parentPort) {
  parentPort.on('message', (message: WorkerMessage) => {
    try {
      if (message.type === 'process') {
        const metrics = aggregateMetrics(message.events);
        const result: WorkerResult = {
          type: 'result',
          metrics
        };
        parentPort!.postMessage(result);
      }
    } catch (error) {
      const result: WorkerResult = {
        type: 'result',
        metrics: {
          sellerMetrics: [],
          categoryMetrics: [],
          lowStockMetrics: { lowStockCount: 0, products: [], lastUpdated: Date.now() }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      parentPort!.postMessage(result);
    }
  });
}
