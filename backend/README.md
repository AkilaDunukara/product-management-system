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
cp .env.example .env
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

All required environment variables are documented in `.env.example`. Copy this file to `.env` and adjust values as needed:

```bash
cp .env.example .env
```

Key configuration includes:
- Database connection (PostgreSQL)
- Cache and pub/sub (Redis)
- Event streaming (Kafka)
- AWS services (LocalStack for development)
- Rate limiting and thresholds

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
└── .env.example             # Environment template
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

Two partial indexes optimize common query patterns (excluding soft-deleted products):

1. **`idx_products_seller_id`** - Fast seller-specific queries
2. **`idx_products_seller_category`** - Fast seller + category filtering

## Architecture

### Repository Pattern

Clean separation: Routes → Services → Repositories → Database

Benefits: Testable, maintainable, flexible data access layer.

### Key Features

- **Event Publishing**: Emits events to Kafka for downstream processing
- **Rate Limiting**: 100 req/sec (standard), 5 req/min (bulk) per seller via Redis
- **CSV Import**: Streaming with backpressure handling, 1000-row batches
- **SSE Notifications**: Real-time updates via Redis pub/sub

For complete architecture details, see the [main README](../README.md#architecture).

## Monitoring

### Health Checks

- `GET /health` - Comprehensive status (database, redis, kafka, memory)
- `GET /health/ready` - Readiness probe (Kubernetes)
- `GET /health/live` - Liveness probe (Kubernetes)

## Production Deployment

See [main README](../README.md#docker-deployment) for complete deployment instructions.

**Security features**: Non-root Docker user, input validation, rate limiting, error sanitization.

## License

MIT License
