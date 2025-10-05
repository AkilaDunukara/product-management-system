# AI Prompt 010: Notification Service Implementation with Unit Tests

## Context

After implementing the backend API server with unit tests (Prompts 007-009), the next step is to build the notification microservice. This is an independent service that consumes product events from Kafka, stores notifications in DynamoDB, and publishes to Redis for real-time SSE delivery.

**Architecture Requirements:**
- Independent microservice at root level (not inside backend/)
- Kafka consumer for 4 event topics
- DynamoDB for notification persistence (30-day TTL)
- Redis pub/sub for SSE real-time delivery
- Retry mechanism with exponential backoff
- TypeScript with comprehensive unit tests

---

## Part 1: Service Implementation

### User Prompt

Implement notification service based on docs/event-contracts.json:

**Structure:**
```
notification-service/
├── src/
│   ├── index.ts
│   ├── consumer.ts
│   ├── handlers/
│   │   ├── productCreated.ts
│   │   ├── productUpdated.ts
│   │   ├── productDeleted.ts
│   │   └── lowStock.ts
│   ├── storage/
│   │   └── dynamodb.ts
│   └── pubsub/
│       └── redis.ts
├── package.json
└── Dockerfile
```

**Flow:**
1. Consume from Kafka (all 4 topics)
2. Transform to notification format
3. Write to DynamoDB (LocalStack)
4. Publish to Redis pub/sub for SSE
5. Implement retry policy (5 retries, exponential backoff)

**Dependencies:**
- kafkajs, aws-sdk, redis, dotenv

**Use TypeScript always**

---

## Part 2: Implementation Details

### Issues Fixed

1. Missing `await` in consumer.ts
2. Redis authentication (password: redis123)
3. DynamoDB table creation with GSI + 30-day TTL
4. Moved to root level (independent microservice)

### Key Features

- Kafka consumer (4 topics, consumer group)
- Event transformation to notification format
- Retry policy: 5 retries, exponential backoff (500ms → 10s)
- DynamoDB storage with GSI on sellerId
   - TTL: 30 days automatic expiration

5. **Redis Pub/Sub**
   - Channel pattern: `notifications:{sellerId}`
   - JSON-serialized notifications
   - Enables SSE real-time delivery


## Part 3: Unit Testing Implementation

### User Prompt

Add unit tests with Jest to cover files in handlers, redis client, dynamodb.ts and consumer.ts. Store them following proper folder structure.

### Testing

**Test Suites:** 7 files, 41 tests
**Coverage:** 97.64% overall (100% for handlers, consumer, storage)
**Tools:** Jest, ts-jest, comprehensive mocking

**Test Structure:**
- handlers/ (4 files, 13 tests)
- storage/dynamodb.test.ts (5 tests)
- pubsub/redis.test.ts (8 tests)
- consumer.test.ts (13 tests)

**Verified:** End-to-end flow (Kafka → DynamoDB → Redis pub/sub)


