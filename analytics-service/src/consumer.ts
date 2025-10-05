import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { Worker } from 'worker_threads';
import path from 'path';
import { ProductEvent, WorkerMessage, WorkerResult, RetryConfig } from './types';
import { DynamoDBStorage } from './storage/dynamodb';
import { S3Archive } from './storage/s3';

/**
 * Kafka consumer for analytics service that processes product events
 * Uses worker threads for CPU-intensive aggregation operations
 */
export class AnalyticsConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private worker: Worker | null = null;
  private eventBatch: ProductEvent[] = [];
  private batchSize: number;
  private retryConfig: RetryConfig;
  private dynamoStorage: DynamoDBStorage;
  private s3Archive: S3Archive;
  private archiveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'analytics-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'analytics-service-group'
    });

    this.batchSize = parseInt(process.env.ARCHIVE_BATCH_SIZE || '100', 10);
    this.retryConfig = {
      maxRetries: parseInt(process.env.MAX_RETRIES || '10', 10),
      initialDelayMs: parseInt(process.env.INITIAL_RETRY_DELAY_MS || '2000', 10),
      backoffMultiplier: parseInt(process.env.BACKOFF_MULTIPLIER || '2', 10),
      maxDelayMs: parseInt(process.env.MAX_RETRY_DELAY_MS || '60000', 10)
    };

    this.dynamoStorage = new DynamoDBStorage();
    this.s3Archive = new S3Archive();
  }

  private createWorker(): Worker {
    const workerPath = path.join(__dirname, 'workers', 'aggregator.worker.js');
    return new Worker(workerPath);
  }

  /**
   * Executes an operation with exponential backoff retry logic
   */

  private async processWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt),
            this.retryConfig.maxDelayMs
          );
          
          console.log(`${context} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`${context} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Processes accumulated events in batch, aggregates metrics, and saves to DynamoDB
   */
  private async processBatch(): Promise<void> {
    if (this.eventBatch.length === 0) return;

    const events = [...this.eventBatch];
    this.eventBatch = [];

    await this.processWithRetry(async () => {
      const metrics = await this.aggregateWithWorker(events);
      
      await this.dynamoStorage.saveAllMetrics(
        metrics.sellerMetrics,
        metrics.categoryMetrics,
        metrics.lowStockMetrics
      );

      console.log(`Processed ${events.length} events. Seller metrics: ${metrics.sellerMetrics.size}, Category metrics: ${metrics.categoryMetrics.size}, Low stock: ${metrics.lowStockMetrics.lowStockCount}`);
    }, 'Batch processing');
  }

  /**
   * Delegates event aggregation to a worker thread to avoid blocking the main thread
   */
  private aggregateWithWorker(events: ProductEvent[]): Promise<{
    sellerMetrics: Map<string, any>;
    categoryMetrics: Map<string, any>;
    lowStockMetrics: any;
  }> {
    return new Promise((resolve, reject) => {
      this.worker = this.createWorker();

      const timeout = setTimeout(() => {
        this.worker?.terminate();
        reject(new Error('Worker timeout'));
      }, 30000);

      this.worker.on('message', (result: WorkerResult) => {
        clearTimeout(timeout);
        this.worker?.terminate();
        this.worker = null;

        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve({
            sellerMetrics: new Map(result.metrics.sellerMetrics),
            categoryMetrics: new Map(result.metrics.categoryMetrics),
            lowStockMetrics: result.metrics.lowStockMetrics
          });
        }
      });

      this.worker.on('error', (error) => {
        clearTimeout(timeout);
        this.worker?.terminate();
        this.worker = null;
        reject(error);
      });

      const message: WorkerMessage = {
        type: 'process',
        events
      };

      this.worker.postMessage(message);
    });
  }

  /**
   * Handles incoming Kafka messages, validates events, and adds to batch
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const event: ProductEvent = JSON.parse(payload.message.value?.toString() || '{}');
      
      if (!event.eventType || !event.data) {
        console.warn('Invalid event format:', event);
        return;
      }

      this.eventBatch.push(event);

      if (this.eventBatch.length >= this.batchSize) {
        await this.processBatch();
      }
    } catch (error) {
      console.error('Error handling message:', error);
      throw error;
    }
  }

  /**
   * Starts periodic scheduler to process batches at configured intervals
   */
  private startArchiveScheduler(): void {
    const intervalHours = parseInt(process.env.ARCHIVE_INTERVAL_HOURS || '24', 10);
    const intervalMs = intervalHours * 60 * 60 * 1000;

    this.archiveInterval = setInterval(async () => {
      try {
        console.log('Starting scheduled archive to S3...');
        await this.processBatch();
      } catch (error) {
        console.error('Archive scheduler error:', error);
      }
    }, intervalMs);

    console.log(`Archive scheduler started (interval: ${intervalHours} hours)`);
  }

  /**
   * Connects to Kafka and starts consuming product events
   */
  async start(): Promise<void> {
    await this.consumer.connect();
    console.log('Analytics consumer connected to Kafka');

    await this.consumer.subscribe({
      topics: ['product.created', 'product.updated', 'product.deleted'],
      fromBeginning: false
    });

    console.log('Subscribed to topics: product.created, product.updated, product.deleted');

    this.startArchiveScheduler();

    await this.consumer.run({
      eachMessage: async (payload) => {
        await this.handleMessage(payload);
      }
    });
  }

  /**
   * Gracefully shuts down consumer, processes remaining events, and disconnects
   */
  async stop(): Promise<void> {
    if (this.archiveInterval) {
      clearInterval(this.archiveInterval);
    }

    await this.processBatch();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    await this.consumer.disconnect();
    console.log('Analytics consumer stopped');
  }
}
