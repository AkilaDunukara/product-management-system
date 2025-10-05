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

**Key Features:**
- Worker threads for CPU-intensive aggregation (non-blocking)
- Kafka consumer with batch processing
- DynamoDB storage with 30-day TTL
- S3 archiving organized by date
- Exponential backoff retry (10 retries)
- Graceful shutdown handling

**Metrics Calculated:**
- Seller metrics (total products, active, deleted, total value)
- Category metrics (products, value, avg price)
- Low stock tracking (quantity < 10)

---

## Part 2: Unit Tests

**Test Suites:** 3 files (storage/dynamodb, storage/s3, workers/aggregator)
**Coverage:** 90%+ overall
**Tools:** Jest, ts-jest, AWS SDK mocks

---

## Part 3: Code Documentation

Added JSDoc comments to all major files (consumer, worker, storage modules)
