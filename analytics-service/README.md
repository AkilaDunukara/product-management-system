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

All required environment variables are documented in `.env.example`. Copy this file to `.env` and adjust values as needed:

```bash
cp .env.example .env
```

Key configuration includes:
- Kafka connection and consumer settings
- DynamoDB table for hot storage
- S3 bucket for cold storage archives
- Retry policy parameters
- Batch processing and archival intervals

## Docker

```bash
docker build -t analytics-service .
docker run --env-file .env analytics-service
```
