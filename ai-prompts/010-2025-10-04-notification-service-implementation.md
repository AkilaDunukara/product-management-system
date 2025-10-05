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

### Initial Issues Found

1. **TypeScript Compilation Error**
   - Missing `await` keyword in consumer.ts
   - `processEvent()` returns Promise but wasn't awaited

2. **Redis Authentication Error**
   - Redis requires password authentication
   - URL format: `redis://:password@host:port`
   - Password: `redis123` (from pms-redis container)

3. **DynamoDB Table Missing**
   - Table doesn't exist in LocalStack
   - Created with GSI on sellerId
   - 30-day TTL configuration

4. **Location Decision**
   - Initially created inside `backend/notification-service/`
   - Moved to root level: `notification-service/`
   - Reason: Independent microservice architecture pattern

### Key Features Implemented

1. **Kafka Consumer**
   - Subscribes to 4 topics: product.created, product.updated, product.deleted, product.lowstock
   - Consumer group: notification-service-group
   - Partition-based ordering by sellerId

2. **Event Transformation**
   - Each handler transforms events to notification format
   - Notification schema: id, sellerId, type, message, data, timestamp, read

3. **Retry Policy** (Exponential Backoff)
   - Max retries: 5
   - Initial delay: 500ms
   - Multiplier: 2x
   - Max delay: 10s
   - Per event-contracts.json specification

4. **DynamoDB Storage**
   - Table: notifications
   - Primary key: id
   - GSI: SellerIdIndex (on sellerId)
   - TTL: 30 days automatic expiration

5. **Redis Pub/Sub**
   - Channel pattern: `notifications:{sellerId}`
   - JSON-serialized notifications
   - Enables SSE real-time delivery


## Part 3: Unit Testing Implementation

### User Prompt

Add unit tests with Jest to cover files in handlers, redis client, dynamodb.ts and consumer.ts. Store them following proper folder structure.

### Testing Setup

**Test Framework:**
- Jest with TypeScript support (ts-jest)
- Coverage reporting (text, lcov, html)
- Fake timers for retry testing
- Comprehensive mocking

```

### Test Structure

```
notification-service/__tests__/
├── handlers/
│   ├── productCreated.test.ts    (3 tests)
│   ├── productUpdated.test.ts    (3 tests)
│   ├── productDeleted.test.ts    (3 tests)
│   └── lowStock.test.ts          (4 tests)
├── storage/
│   └── dynamodb.test.ts          (5 tests)
├── pubsub/
│   └── redis.test.ts             (8 tests)
└── consumer.test.ts              (13 tests)

Total: 7 test suites, 41 tests, 1,088 lines of test code
```

### Test Coverage Results

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   97.64 |      100 |   88.23 |     100
 consumer.ts        |     100 |      100 |     100 |     100
 handlers/          |     100 |      100 |     100 |     100
  productCreated.ts |     100 |      100 |     100 |     100
  productUpdated.ts |     100 |      100 |     100 |     100
  productDeleted.ts |     100 |      100 |     100 |     100
  lowStock.ts       |     100 |      100 |     100 |     100
 storage/dynamodb.ts|     100 |      100 |     100 |     100
 pubsub/redis.ts    |   85.71 |      100 |      60 |     100

### Test Verification

**Test Event Sent:**
```json
{
  "eventId": "seller-123-12345-ProductCreated-1759566574779",
  "eventType": "ProductCreated",
  "timestamp": 1759566574779,
  "data": {
    "productId": 12345,
    "sellerId": "seller-123",
    "name": "Test Wireless Mouse",
    "price": 29.99,
    "quantity": 150,
    "category": "Electronics"
  }
}
```

**Result:**
✅ Event consumed from Kafka  
✅ Notification saved to DynamoDB  
✅ Published to Redis (notifications:seller-123)  
✅ Successfully processed  

### Files Summary

**Total Files Created:** 26 files

**Source Code:** 11 files (~700 lines)
- 1 entry point
- 1 consumer
- 4 handlers
- 1 storage module
- 1 pub/sub module
- 1 types file

**Tests:** 7 files (~1,088 lines)
- 4 handler test files
- 1 storage test file
- 1 pub/sub test file
- 1 consumer test file

**Configuration:** 8 files
- package.json, tsconfig.json, jest.config.js
- .env, .env.example
- .gitignore, .dockerignore
- Dockerfile

**Documentation:** 3 files
- README.md
- IMPLEMENTATION.md
- TEST_SUMMARY.md

### Project Structure Update

```
product-management-system/
├── backend/              # API Server (Express REST API)
├── notification-service/ # Notification Microservice ✅ NEW
├── docs/
├── ai-prompts/
└── PROJECT_STRUCTURE.md  # Updated with service info
```

## Key Learnings

1. **Microservice Architecture**: Independent services should be at root level, not nested
2. **Environment Management**: Use .env files with dotenv for cleaner configuration
3. **Testing Strategy**: Mock all external dependencies for fast, reliable tests
4. **Retry Logic**: Implement exponential backoff for resilience
5. **TypeScript**: Strict mode catches errors early (e.g., missing await)
6. **Coverage Goals**: 97%+ coverage achievable with comprehensive tests
7. **Documentation**: Multiple docs serve different purposes (README, IMPLEMENTATION, TEST_SUMMARY)


