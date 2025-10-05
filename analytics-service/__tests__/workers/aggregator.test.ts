import { Worker } from 'worker_threads';
import path from 'path';
import { ProductEvent, WorkerMessage, WorkerResult } from '../../src/types';

describe('Aggregator Worker', () => {
  const workerPath = path.join(__dirname, '../../dist/workers/aggregator.worker.js');

  function runWorker(events: ProductEvent[]): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath);

      worker.on('message', (result: WorkerResult) => {
        worker.terminate();
        resolve(result);
      });

      worker.on('error', (error) => {
        worker.terminate();
        reject(error);
      });

      const message: WorkerMessage = {
        type: 'process',
        events
      };

      worker.postMessage(message);
    });
  }

  it('should aggregate seller metrics from ProductCreated events', async () => {
    const events: ProductEvent[] = [
      {
        eventId: 'seller-1-100-ProductCreated-1000',
        eventType: 'ProductCreated',
        timestamp: 1000,
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Product A',
          price: 10,
          quantity: 5,
          category: 'Electronics'
        }
      },
      {
        eventId: 'seller-1-101-ProductCreated-2000',
        eventType: 'ProductCreated',
        timestamp: 2000,
        data: {
          productId: 101,
          sellerId: 'seller-1',
          name: 'Product B',
          price: 20,
          quantity: 3,
          category: 'Electronics'
        }
      }
    ];

    const result = await runWorker(events);

    expect(result.type).toBe('result');
    expect(result.metrics.sellerMetrics).toHaveLength(1);
    
    const [sellerId, metrics] = result.metrics.sellerMetrics[0];
    expect(sellerId).toBe('seller-1');
    expect(metrics.totalProducts).toBe(2);
    expect(metrics.activeProducts).toBe(2);
    expect(metrics.totalValue).toBe(110);
  });

  it('should aggregate category metrics', async () => {
    const events: ProductEvent[] = [
      {
        eventId: 'seller-1-100-ProductCreated-1000',
        eventType: 'ProductCreated',
        timestamp: 1000,
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Product A',
          price: 30,
          quantity: 2,
          category: 'Books'
        }
      }
    ];

    const result = await runWorker(events);

    expect(result.metrics.categoryMetrics).toHaveLength(1);
    const [category, metrics] = result.metrics.categoryMetrics[0];
    expect(category).toBe('Books');
    expect(metrics.totalProducts).toBe(1);
    expect(metrics.totalValue).toBe(60);
    expect(metrics.averagePrice).toBe(60);
  });

  it('should track low stock products', async () => {
    const events: ProductEvent[] = [
      {
        eventId: 'seller-1-100-ProductCreated-1000',
        eventType: 'ProductCreated',
        timestamp: 1000,
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Low Stock Item',
          price: 10,
          quantity: 5,
          category: 'Electronics'
        }
      }
    ];

    const result = await runWorker(events);

    expect(result.metrics.lowStockMetrics.lowStockCount).toBe(1);
    expect(result.metrics.lowStockMetrics.products).toHaveLength(1);
    expect(result.metrics.lowStockMetrics.products[0].productId).toBe(100);
    expect(result.metrics.lowStockMetrics.products[0].quantity).toBe(5);
  });

  it('should handle ProductUpdated events', async () => {
    const events: ProductEvent[] = [
      {
        eventId: 'seller-1-100-ProductCreated-1000',
        eventType: 'ProductCreated',
        timestamp: 1000,
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Product A',
          price: 10,
          quantity: 5,
          category: 'Electronics'
        }
      },
      {
        eventId: 'seller-1-100-ProductUpdated-2000',
        eventType: 'ProductUpdated',
        timestamp: 2000,
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Product A',
          price: 15,
          quantity: 8,
          category: 'Electronics',
          changes: {
            price: { old: 10, new: 15 },
            quantity: { old: 5, new: 8 }
          }
        }
      }
    ];

    const result = await runWorker(events);

    const [, metrics] = result.metrics.sellerMetrics[0];
    expect(metrics.totalValue).toBe(120);
  });

  it('should handle ProductDeleted events', async () => {
    const events: ProductEvent[] = [
      {
        eventId: 'seller-1-100-ProductCreated-1000',
        eventType: 'ProductCreated',
        timestamp: 1000,
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Product A',
          price: 10,
          quantity: 5,
          category: 'Electronics'
        }
      },
      {
        eventId: 'seller-1-100-ProductDeleted-2000',
        eventType: 'ProductDeleted',
        timestamp: 2000,
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Product A',
          price: 0,
          quantity: 0,
          category: 'Electronics'
        }
      }
    ];

    const result = await runWorker(events);

    const [, metrics] = result.metrics.sellerMetrics[0];
    expect(metrics.activeProducts).toBe(0);
    expect(metrics.deletedProducts).toBe(1);
  });
});
