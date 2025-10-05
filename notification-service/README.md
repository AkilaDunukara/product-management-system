# Notification Service

Independent microservice that consumes product events from Kafka and delivers real-time notifications.

**Location:** Root-level service (not inside backend/)

## Architecture

```
Kafka Topics → Consumer → Transform → DynamoDB + Redis Pub/Sub
```

## Event Processing Flow

1. **Consume** from 4 Kafka topics:
   - `product.created`
   - `product.updated`
   - `product.deleted`
   - `product.lowstock`

2. **Transform** events to notification format

3. **Store** in DynamoDB (30-day TTL)

4. **Publish** to Redis pub/sub for SSE delivery

## Retry Policy

- Max retries: 5
- Initial delay: 500ms
- Backoff multiplier: 2x
- Max delay: 10s

## Local Development

```bash
npm install
npm run dev
```

## Build & Run

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t notification-service .
docker run --env-file .env notification-service
```

## Environment Variables

See `.env.example` for required configuration.

