# Notification Service - Implementation Summary

## Overview
TypeScript-based Kafka consumer service that processes product events and delivers real-time notifications via DynamoDB storage and Redis pub/sub.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Kafka     │────▶│   Consumer   │────▶│ Handlers  │
│  (4 topics) │     │  (KafkaJS)   │     │ (Transform)│
└─────────────┘     └──────────────┘     └─────┬─────┘
                                               │
                                               ▼
                    ┌──────────────────────────────┐
                    │                              │
                    ▼                              ▼
            ┌──────────────┐            ┌──────────────┐
            │  DynamoDB    │            │    Redis     │
            │  (Storage)   │            │  (Pub/Sub)   │
            │  30-day TTL  │            │   for SSE    │
            └──────────────┘            └──────────────┘
```

## Files Created

### Core Files
- **src/index.ts** - Main entry point, handles startup and graceful shutdown
- **src/consumer.ts** - Kafka consumer with retry logic and message processing
- **src/types.ts** - TypeScript interfaces for all event types and notifications

### Event Handlers (4 handlers)
- **src/handlers/productCreated.ts** - Transforms ProductCreated events
- **src/handlers/productUpdated.ts** - Transforms ProductUpdated events
- **src/handlers/productDeleted.ts** - Transforms ProductDeleted events
- **src/handlers/lowStock.ts** - Transforms LowStockWarning events

### Storage & Pub/Sub
- **src/storage/dynamodb.ts** - DynamoDB client for notification persistence
- **src/pubsub/redis.ts** - Redis pub/sub for SSE real-time delivery

### Configuration
- **package.json** - Dependencies: kafkajs, aws-sdk, redis
- **tsconfig.json** - TypeScript configuration (ES2022, strict mode)
- **Dockerfile** - Multi-stage build for production
- **.dockerignore** - Build optimization
- **.gitignore** - Git ignore patterns

## Key Features Implemented

### 1. Kafka Consumer
- Subscribes to 4 topics: `product.created`, `product.updated`, `product.deleted`, `product.lowstock`
- Consumer group: `notification-service-group`
- Processes messages with partition ordering guarantee

### 2. Event Transformation
Each handler transforms events into notification format:
```typescript
{
  id: string,           // eventId
  sellerId: string,     // for targeted delivery
  type: string,         // event type
  message: string,      // human-readable message
  data: object,         // relevant event data
  timestamp: number,    // event timestamp
  read: boolean         // notification status
}
```

### 3. Retry Policy (Exponential Backoff)
- Max retries: 5
- Initial delay: 500ms
- Backoff multiplier: 2x
- Max delay: 10s
- Implements as per event-contracts.json specification

### 4. DynamoDB Storage
- Table: `notifications`
- TTL: 30 days (2,592,000 seconds)
- Stores complete notification payload
- LocalStack compatible for local dev

### 5. Redis Pub/Sub
- Channel pattern: `notifications:{sellerId}`
- Publishes JSON-serialized notifications
- Enables real-time SSE delivery to API server

## Environment Configuration

```bash
KAFKA_BROKERS=kafka:9092
REDIS_URL=redis://redis:6379
DYNAMODB_ENDPOINT=http://localstack:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
NOTIFICATIONS_TABLE=notifications
```

## Usage

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t notification-service .
docker run --env-file .env notification-service
```

## Event Examples

### ProductCreated → Notification
```json
{
  "id": "seller-123-12345-ProductCreated-1696176000000",
  "sellerId": "seller-123",
  "type": "ProductCreated",
  "message": "New product created: Wireless Mouse",
  "data": {
    "productId": 12345,
    "name": "Wireless Mouse",
    "category": "Electronics",
    "price": 29.99,
    "quantity": 150
  },
  "timestamp": 1696176000000,
  "read": false
}
```

### LowStockWarning → Notification
```json
{
  "id": "seller-456-67890-LowStockWarning-1696176030000",
  "sellerId": "seller-456",
  "type": "LowStockWarning",
  "message": "Low stock alert: USB-C Cable (8 left)",
  "data": {
    "productId": 67890,
    "name": "USB-C Cable",
    "category": "Accessories",
    "quantity": 8,
    "threshold": 10,
    "price": 12.99
  },
  "timestamp": 1696176030000,
  "read": false
}
```

## Error Handling

1. **Kafka Connection Errors**: Automatic reconnection via KafkaJS
2. **DynamoDB Errors**: Retry with exponential backoff
3. **Redis Errors**: Logged, doesn't block DynamoDB write
4. **Parse Errors**: Logged and skipped
5. **Shutdown**: Graceful disconnect on SIGTERM/SIGINT

## Performance Considerations

- **At-least-once delivery**: Events may be processed multiple times
- **Idempotency**: Same eventId prevents duplicate notifications in DynamoDB
- **Partitioning**: Events partitioned by sellerId for ordering guarantee
- **Backpressure**: KafkaJS handles consumer lag automatically

## Next Steps

1. Deploy alongside Kafka, Redis, and LocalStack in docker-compose
2. Configure DynamoDB table creation via LocalStack init scripts
3. Monitor consumer lag and error rates
4. Add dead-letter queue handling for failed events
5. Implement notification read/unread API

## Compliance

✅ Follows event-contracts.json specification
✅ Implements retry policy as defined
✅ Subscribes to all 4 required topics
✅ Outputs to DynamoDB and Redis as per architecture
✅ TypeScript with strict mode enabled
✅ Simple demo-friendly implementation

