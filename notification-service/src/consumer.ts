import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ProductEvent, Notification, RetryConfig } from './types';
import { handleProductCreated } from './handlers/productCreated';
import { handleProductUpdated } from './handlers/productUpdated';
import { handleProductDeleted } from './handlers/productDeleted';
import { handleLowStock } from './handlers/lowStock';
import { saveNotification } from './storage/dynamodb';
import { publishNotification } from './pubsub/redis';

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialRetryDelayMs: 500,
  backoffMultiplier: 2,
  maxRetryDelayMs: 10000,
};

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
});

const consumer: Consumer = kafka.consumer({
  groupId: 'notification-service-group',
});

async function processEvent(event: ProductEvent): Promise<Notification> {
  switch (event.eventType) {
    case 'ProductCreated':
      return handleProductCreated(event);
    case 'ProductUpdated':
      return handleProductUpdated(event);
    case 'ProductDeleted':
      return handleProductDeleted(event);
    case 'LowStockWarning':
      return handleLowStock(event);
    default:
      throw new Error(`Unknown event type: ${(event as any).eventType}`);
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  attempt: number = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= config.maxRetries) {
      console.error(`[Retry] Max retries (${config.maxRetries}) reached`);
      throw error;
    }

    const delay = Math.min(
      config.initialRetryDelayMs * Math.pow(config.backoffMultiplier, attempt),
      config.maxRetryDelayMs
    );

    console.log(`[Retry] Attempt ${attempt + 1}/${config.maxRetries}, waiting ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return retryWithBackoff(fn, config, attempt + 1);
  }
}

async function handleMessage({ topic, partition, message }: EachMessagePayload): Promise<void> {
  const eventJson = message.value?.toString();
  if (!eventJson) {
    console.warn('[Consumer] Empty message received');
    return;
  }

  try {
    const event: ProductEvent = JSON.parse(eventJson);
    console.log(`[Consumer] Processing ${event.eventType} from ${topic} (partition ${partition})`);

    const notification = await processEvent(event);

    await retryWithBackoff(
      async () => {
        await saveNotification(notification);
        await publishNotification(notification);
      },
      RETRY_CONFIG
    );

    console.log(`[Consumer] Successfully processed event: ${event.eventId}`);
  } catch (error) {
    console.error('[Consumer] Failed to process message:', error);
    throw error;
  }
}

export async function startConsumer(): Promise<void> {
  await consumer.connect();
  console.log('[Consumer] Connected to Kafka');

  await consumer.subscribe({
    topics: ['product.created', 'product.updated', 'product.deleted', 'product.lowstock'],
    fromBeginning: false,
  });

  console.log('[Consumer] Subscribed to topics');

  await consumer.run({
    eachMessage: handleMessage,
  });
}

export async function stopConsumer(): Promise<void> {
  await consumer.disconnect();
  console.log('[Consumer] Disconnected from Kafka');
}

