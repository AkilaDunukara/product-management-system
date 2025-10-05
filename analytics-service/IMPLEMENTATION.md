# Analytics Service Implementation

## Overview

The Analytics Service is a microservice that consumes product events from Kafka, processes them using Worker Threads for CPU-intensive calculations, and stores metrics in DynamoDB (hot storage) and S3 (cold storage).

## Architecture

### Components

1. **Consumer** (`src/consumer.ts`)
   - Consumes events from 3 Kafka topics: `product.created`, `product.updated`, `product.deleted`
   - Batches events for efficient processing
   - Implements retry logic with exponential backoff (10 retries)
   - Schedules periodic archival to S3

2. **Worker Thread** (`src/workers/aggregator.worker.ts`)
   - Runs CPU-intensive metric aggregation in a separate thread
   - Calculates seller metrics, category metrics, and low stock counts
   - Isolated from main thread to prevent blocking

3. **DynamoDB Storage** (`src/storage/dynamodb.ts`)
   - Stores metrics with 30-day TTL
   - Partition keys: `SELLER#{sellerId}`, `CATEGORY#{category}`, `LOWSTOCK`
   - Sort keys: `METRICS#{timestamp}`

4. **S3 Archive** (`src/storage/s3.ts`)
   - Archives metrics daily in JSON format
   - Path structure: `analytics/{date}/{timestamp}.json`

## Worker Thread Implementation

### Why Worker Threads?

Worker Threads are used for CPU-intensive metric aggregation to:
- Prevent blocking the main event loop
- Enable parallel processing of large event batches
- Isolate computation from I/O operations

### How It Works

```typescript
// Main thread sends events to worker
const worker = new Worker('aggregator.worker.js');
worker.postMessage({ type: 'process', events: [...] });

// Worker processes events and returns metrics
worker.on('message', (result) => {
  const { sellerMetrics, categoryMetrics, lowStockMetrics } = result.metrics;
  // Save to DynamoDB
});
```

### Aggregation Logic

The worker aggregates three types of metrics:

1. **Seller Metrics**
   - Total products per seller
   - Active vs deleted product counts
   - Total inventory value

2. **Category Metrics**
   - Total products per category
   - Total value per category
   - Average price per category

3. **Low Stock Metrics**
   - Count of products with quantity < 10
   - List of low stock products with details

## Retry Policy

Implements exponential backoff retry strategy:

```
Attempt 1: 2000ms delay
Attempt 2: 4000ms delay
Attempt 3: 8000ms delay
...
Attempt 10: 60000ms delay (capped)
```

Configuration from `docs/event-contracts.json`:
- Max retries: 10
- Initial delay: 2000ms
- Backoff multiplier: 2
- Max delay: 60000ms

## Data Flow

```
Kafka Topics
    ↓
Consumer (batching)
    ↓
Worker Thread (aggregation)
    ↓
DynamoDB (hot storage, 30-day TTL)
    ↓
S3 (cold storage, daily archives)
```

## Metrics Storage

### DynamoDB Schema

```json
{
  "PK": "SELLER#seller-1",
  "SK": "METRICS#1696176000000",
  "Type": "SellerMetrics",
  "sellerId": "seller-1",
  "totalProducts": 10,
  "activeProducts": 8,
  "deletedProducts": 2,
  "totalValue": 1000,
  "lastUpdated": 1696176000000,
  "TTL": 1698768000
}
```

### S3 Archive Format

```json
{
  "timestamp": "2025-10-05T12:00:00.000Z",
  "sellerMetrics": [...],
  "categoryMetrics": [...],
  "lowStockMetrics": {...}
}
```

## Performance Considerations

1. **Batching**: Events are batched (default: 100) before processing
2. **Worker Isolation**: CPU-intensive work doesn't block I/O
3. **Parallel Storage**: DynamoDB writes happen in parallel
4. **TTL Management**: Automatic cleanup after 30 days
5. **Scheduled Archival**: Reduces S3 write costs

## Testing

Run tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Test the service with sample events:
```bash
node test-event.js
```

## Monitoring

The service logs:
- Event consumption
- Batch processing results
- Retry attempts
- Archive operations
- Errors with context

## Error Handling

1. **Invalid Events**: Logged and skipped
2. **Worker Errors**: Caught and retried
3. **Storage Errors**: Retried with exponential backoff
4. **Worker Timeout**: 30 seconds, then terminated and retried

## Deployment

### Docker

```bash
docker build -t analytics-service .
docker run --env-file .env analytics-service
```

### Local Development

```bash
npm install
npm run dev
```

## Configuration

All configuration via environment variables (see `config.env.template`):
- Kafka connection
- AWS credentials and endpoints
- Retry policy parameters
- Batch and archive settings
