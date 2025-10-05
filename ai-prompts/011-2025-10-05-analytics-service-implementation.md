# AI Prompt 011: Analytics Service Implementation with Worker Threads

## Context

After implementing the backend API and notification service, the next step is to build the analytics microservice. This service consumes product events from Kafka, aggregates metrics using worker threads, and stores results in DynamoDB with S3 archiving.

**Architecture Requirements:**
- Independent microservice at root level
- Kafka consumer for product events
- Worker threads for CPU-intensive aggregation
- DynamoDB for metrics storage (30-day TTL)
- S3 for long-term archiving
- TypeScript with comprehensive unit tests

---

## Part 1: Service Implementation

### User Prompt

Build an analytics service that:
1. Consumes product events from Kafka topics (product.created, product.updated, product.deleted)
2. Uses worker threads to aggregate metrics without blocking the main thread
3. Calculates seller metrics (total products, active products, deleted products, total value)
4. Calculates category metrics (total products, total value, average price)
5. Tracks low stock products (quantity < 10)
6. Stores metrics in DynamoDB with 30-day TTL
7. Archives metrics to S3 for long-term storage
8. Implements retry logic with exponential backoff
9. Includes batch processing for efficiency

### Implementation Summary

**Created Files:**
- `analytics-service/src/index.ts` - Main entry point with graceful shutdown
- `analytics-service/src/consumer.ts` - Kafka consumer with batch processing
- `analytics-service/src/workers/aggregator.worker.ts` - Worker thread for metrics aggregation
- `analytics-service/src/storage/dynamodb.ts` - DynamoDB storage with TTL
- `analytics-service/src/storage/s3.ts` - S3 archiving service
- `analytics-service/src/types/index.ts` - TypeScript interfaces
- `analytics-service/package.json` - Dependencies and scripts
- `analytics-service/tsconfig.json` - TypeScript configuration
- `analytics-service/Dockerfile` - Container configuration

**Key Features:**
- Worker thread aggregation to avoid blocking main event loop
- Exponential backoff retry mechanism
- Batch processing with configurable size
- Periodic archiving scheduler
- DynamoDB with automatic TTL expiration
- S3 archiving organized by date
- Graceful shutdown handling

---

## Part 2: Unit Tests

### User Prompt

Add comprehensive unit tests for the analytics service covering:
1. DynamoDB storage operations
2. S3 archiving functionality
3. Worker thread aggregation logic
4. All metrics calculations
5. Error handling and retries

### Implementation Summary

**Created Test Files:**
- `analytics-service/__tests__/storage/dynamodb.test.ts` - DynamoDB storage tests
- `analytics-service/__tests__/storage/s3.test.ts` - S3 archiving tests
- `analytics-service/__tests__/workers/aggregator.test.ts` - Worker aggregation tests
- `analytics-service/jest.config.js` - Jest configuration
- `analytics-service/TEST_SUMMARY.md` - Test coverage report

**Test Coverage:**
- All storage operations (DynamoDB and S3)
- Metrics aggregation for all event types
- Low stock tracking logic
- Error handling scenarios
- Mock implementations for AWS services

---

## Part 3: Code Documentation

### User Prompt

Add necessary code comments to the large files in analytics-service folder.

### Implementation Summary

**Updated Files with Comments:**
- `src/consumer.ts` - Class and method documentation
- `src/workers/aggregator.worker.ts` - Function and inline comments
- `src/storage/dynamodb.ts` - Storage method documentation
- `src/storage/s3.ts` - Archiving method documentation
- `src/types/index.ts` - Interface documentation
- `src/index.ts` - Entry point documentation

## Technologies Used

- **TypeScript** - Type-safe implementation
- **KafkaJS** - Kafka client for event consumption
- **Worker Threads** - CPU-intensive aggregation without blocking
- **AWS SDK** - DynamoDB and S3 integration
- **Jest** - Unit testing framework
- **Docker** - Containerization

---

## Service Architecture

```
Analytics Service
├── Kafka Consumer (main thread)
│   ├── Batch event collection
│   └── Periodic processing
├── Worker Thread
│   ├── Seller metrics aggregation
│   ├── Category metrics aggregation
│   └── Low stock tracking
├── DynamoDB Storage
│   ├── Seller metrics (30-day TTL)
│   ├── Category metrics (30-day TTL)
│   └── Low stock metrics (30-day TTL)
└── S3 Archive
    └── Long-term metrics storage (organized by date)
