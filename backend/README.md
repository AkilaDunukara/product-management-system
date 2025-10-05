# Product Management API Backend

A Node.js REST API server with event-driven architecture for managing e-commerce products.

## Features

- **Express.js REST API** - 8 endpoints matching OpenAPI specification
- **Repository Pattern** - Clean separation of data access and business logic
- **PostgreSQL Integration** - Connection pooling, transactions, CRUD operations
- **Kafka Producer** - Event publishing with consistent partitioning
- **Redis Rate Limiting** - Sliding window algorithm with cleanup
- **SSE Real-time Events** - Redis pub/sub integration for notifications
- **CSV Streaming Import** - Memory-efficient batch processing with validation
- **Authentication** - X-Seller-Id header validation
- **Error Handling** - Comprehensive middleware with structured responses
- **Input Validation** - Joi schemas with detailed error messages
- **Health Checks** - Multiple endpoints for monitoring

## Quick Start

### 1. Environment Setup

Create environment file from template:
```bash
cp config.env.template .env
```

Edit `.env` file with your configuration values.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Or start production server:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## Docker Setup

### Build and Run with Docker Compose

From the project root directory:

```bash
# Start all infrastructure services
docker-compose up -d postgres redis zookeeper kafka localstack

# Start the API server
docker-compose up --build api-server
```

### Multi-Service Architecture

The Dockerfile supports multiple service targets:

- `api-server` - Main REST API server
- `notification-service` - Event processing and SSE notifications  
- `analytics-service` - Data aggregation with Worker Threads

## API Endpoints

### Products
- `POST /api/products` - Create product
- `GET /api/products` - List products (with filtering/pagination)
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (soft delete)
- `POST /api/products/import` - CSV bulk import

### Events
- `GET /api/events/stream` - SSE real-time notifications

### Health
- `GET /health` - Comprehensive health check
- `GET /health/ready` - Readiness probe (for Kubernetes)
- `GET /health/live` - Liveness probe (for Kubernetes)

## Authentication

All API endpoints require the `X-Seller-Id` header:

```bash
curl -H "X-Seller-Id: seller-123" http://localhost:3001/api/products
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `POSTGRES_HOST` | PostgreSQL host | `postgres` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `product_management` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres123` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `redis123` |
| `KAFKA_BROKERS` | Kafka broker list | `kafka:29092` |
| `KAFKA_CLIENT_ID` | Kafka client ID | `api-server` |
| `AWS_ENDPOINT` | LocalStack endpoint | `http://localstack:4566` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `test` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `test` |
| `RATE_LIMIT_STANDARD` | Standard rate limit (req/sec) | `100` |
| `RATE_LIMIT_BULK` | Bulk operation rate limit (req/min) | `5` |
| `LOW_STOCK_THRESHOLD` | Low stock warning threshold | `10` |

## Development

### Project Structure

```
backend/
├── src/
│   ├── server.js                    # Main application entry
│   ├── config/                      # Configuration modules
│   │   ├── database.js             # PostgreSQL setup
│   │   ├── kafka.js                # Kafka producer
│   │   └── redis.js                # Redis clients
│   ├── middleware/                  # Express middleware
│   │   ├── auth.js                 # Authentication
│   │   ├── rateLimiter.js          # Rate limiting
│   │   └── errorHandler.js         # Error handling
│   ├── repositories/                # Data access layer
│   │   └── productRepository.js    # Product database operations
│   ├── validation/                  # Input validation
│   │   └── productSchemas.js       # Joi schemas
│   ├── services/                    # Business logic
│   │   ├── productService.js       # Product operations
│   │   └── csvImportService.js     # CSV processing
│   └── routes/                      # API endpoints
│       ├── products.js             # Product routes
│       ├── events.js               # SSE endpoint
│       └── health.js               # Health checks
├── migrations/                      # Database migrations
├── package.json                     # Dependencies
├── Dockerfile                       # Multi-stage builds
├── .env                            # Environment variables
└── config.env.template             # Environment template
```

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report

## Database Schema

### Products Table

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    seller_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Database Indexes

Two partial indexes optimize common query patterns:

1. **`idx_products_seller_id`** - Index on `seller_id` (partial: WHERE deleted_at IS NULL)
   - **Why**: Most queries filter by seller_id to show products for a specific seller
   - **Benefit**: Fast lookups for GET /api/products?sellerId=xxx
   - **Partial**: Only indexes active products (not soft-deleted)

2. **`idx_products_seller_category`** - Composite index on `(seller_id, category)` (partial: WHERE deleted_at IS NULL)
   - **Why**: Common filtering pattern by seller and category together
   - **Benefit**: Fast lookups for GET /api/products?sellerId=xxx&category=Electronics
   - **Partial**: Reduces index size by excluding deleted products

Both indexes exclude soft-deleted products (`WHERE deleted_at IS NULL`) to keep index size small and queries fast.

## Architecture

### Repository Pattern

The application follows the Repository Pattern for clean separation of concerns:

- **Controllers (Routes)** - Handle HTTP requests/responses and validation
- **Services** - Contain business logic and orchestrate operations
- **Repositories** - Handle data access and database operations
- **Models** - Data structures and validation schemas

This pattern provides:
- **Testability** - Easy to mock repositories for unit testing
- **Maintainability** - Clear separation between business logic and data access
- **Flexibility** - Easy to switch data sources without changing business logic
- **Consistency** - Standardized data access patterns

### Event-Driven Flow

1. API writes product changes to PostgreSQL
2. Events emitted to Kafka (product.created, product.updated, product.deleted, product.lowstock)
3. Notification Service consumes events → writes to DynamoDB → publishes to Redis Pub/Sub
4. Analytics Service consumes events → Worker Threads process → writes to DynamoDB (hot) → archives to S3 (cold)
5. SSE endpoint subscribes to Redis → pushes real-time notifications to connected clients

### Rate Limiting

- **Standard endpoints**: 100 requests per second per seller
- **Bulk operations**: 5 requests per minute per seller
- **Implementation**: Redis sorted sets with sliding window algorithm

### CSV Import

- **Memory-efficient**: Node.js Streams with backpressure handling
- **Batch processing**: 1000 rows per batch
- **Validation**: Joi schema validation for each row
- **Async processing**: Returns 202 Accepted immediately

## Monitoring

### Health Checks

The `/health` endpoint provides comprehensive service status:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T16:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": { "status": "healthy", "response_time_ms": 5 },
    "redis": { "status": "healthy", "response_time_ms": 2 },
    "kafka": { "status": "healthy", "note": "Producer connected" }
  },
  "memory": {
    "rss_mb": 45,
    "heap_used_mb": 25,
    "heap_total_mb": 35,
    "external_mb": 8
  }
}
```

### Logging

- Structured logging with timestamps
- Request/response logging
- Error tracking with stack traces
- Performance metrics

## Production Deployment

### Docker Production Build

```bash
# Build production image
docker build --target api-server -t product-api:latest .

# Run with production environment
docker run -d \
  --name product-api \
  -p 3001:3001 \
  --env-file .env \
  product-api:latest
```

### Kubernetes Deployment

The health check endpoints support Kubernetes probes:

- **Liveness**: `GET /health/live`
- **Readiness**: `GET /health/ready`

### Security Considerations

- Non-root Docker user
- Input validation and sanitization
- Rate limiting per seller
- Error message sanitization
- Environment variable protection

## License

MIT License
