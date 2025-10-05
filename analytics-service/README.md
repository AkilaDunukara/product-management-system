# Analytics Service

Analytics microservice for product management system that processes events using Worker Threads for CPU-intensive calculations.

## Features

- **Kafka Consumer**: Consumes product events (created, updated, deleted)
- **Worker Threads**: CPU-intensive aggregation in separate threads
- **Hot Storage**: DynamoDB with 30-day TTL
- **Cold Storage**: S3 daily batch archives
- **Retry Policy**: 10 retries with exponential backoff

## Metrics Calculated

- **Seller Metrics**: Total products, active/deleted counts, total value per seller
- **Category Metrics**: Total products, total value, average price per category
- **Low Stock Metrics**: Count and list of products with quantity < 10

## Architecture

```
Kafka Topics → Consumer → Worker Thread (Aggregation) → DynamoDB (Hot) + S3 (Cold)
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build:
```bash
npm run build
```

4. Run:
```bash
npm start
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
npm run test:coverage
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| KAFKA_BROKERS | Kafka broker addresses | localhost:9092 |
| KAFKA_CLIENT_ID | Kafka client identifier | analytics-service |
| KAFKA_GROUP_ID | Kafka consumer group | analytics-service-group |
| DYNAMODB_TABLE_NAME | DynamoDB table name | analytics-metrics |
| S3_BUCKET_NAME | S3 bucket for archives | analytics-archive |
| MAX_RETRIES | Maximum retry attempts | 10 |
| INITIAL_RETRY_DELAY_MS | Initial retry delay | 2000 |
| BACKOFF_MULTIPLIER | Backoff multiplier | 2 |
| MAX_RETRY_DELAY_MS | Maximum retry delay | 60000 |
| ARCHIVE_BATCH_SIZE | Events per batch | 100 |
| ARCHIVE_INTERVAL_HOURS | Archive interval | 24 |

## Docker

```bash
docker build -t analytics-service .
docker run --env-file .env analytics-service
```
