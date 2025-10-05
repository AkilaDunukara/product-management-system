# Product Management System

A complete microservices-based product management system with real-time notifications and analytics.

## Architecture

```
┌─────────────┐
│   Frontend  │ (React + TypeScript)
└──────┬──────┘
       │ REST API + SSE
┌──────▼──────────────────────────────────────────┐
│            Backend API Server                    │
│  (Express + PostgreSQL + Kafka + Redis)         │
└──────┬──────────────────────────────────────────┘
       │ Kafka Events
       ├──────────────────┬─────────────────────┐
       │                  │                     │
┌──────▼──────┐  ┌───────▼────────┐  ┌─────────▼────────┐
│ Notification│  │   Analytics    │  │   Redis Pub/Sub  │
│   Service   │  │    Service     │  │   (SSE Stream)   │
│  (DynamoDB) │  │ (DynamoDB+S3)  │  │                  │
└─────────────┘  └────────────────┘  └──────────────────┘
```

## Services

- **Backend API**: REST API with PostgreSQL, Kafka producer, Redis rate limiting
- **Frontend**: React + TypeScript UI with real-time SSE notifications
- **Notification Service**: Kafka consumer → DynamoDB → Redis pub/sub
- **Analytics Service**: Kafka consumer → Worker threads → DynamoDB + S3

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

## Quick Start

### Automated Setup (Recommended)

Use the provided shell scripts to start all services:

```bash
./start-services.sh
```

This will:
1. Start all infrastructure services (PostgreSQL, Redis, Kafka, etc.)
2. Install dependencies for all services
3. Build all services
4. Start all services in production mode
5. Save process IDs for easy shutdown

To stop all services:

```bash
./stop-services.sh
```

To view logs:

```bash
./view-logs.sh
```

### Development Mode

For development with auto-reload:

```bash
./start-dev.sh
```

This opens each service in a separate terminal window with hot-reload enabled.

### Manual Setup

If you prefer to start services manually:

#### 1. Start Infrastructure Services

```bash
cd backend
docker-compose up -d postgres redis zookeeper kafka localstack
```

Wait for services to be ready (~30 seconds):

```bash
docker-compose ps
```

#### 2. Setup Backend API

```bash
cd backend
npm install
cp config.env.template .env
npm run build
npm start
```

Backend will run on `http://localhost:3001`

#### 3. Setup Notification Service

```bash
cd notification-service
npm install
npm run build
npm start
```

#### 4. Setup Analytics Service

```bash
cd analytics-service
npm install
npm run build
npm start
```

#### 5. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

## Development Mode

Run all services in development mode with auto-reload:

```bash
cd backend && npm run dev

cd notification-service && npm run dev

cd analytics-service && npm run dev

cd frontend && npm run dev
```

## Database Setup

The backend automatically runs migrations on startup. To manually run migrations:

```bash
cd backend

docker exec -i product-management-system-postgres-1 psql -U postgres -d product_management < migrations/001_up_initial_schema.sql
```

## Seed Data

Import sample products using the provided CSV file:

```bash
curl -X POST http://localhost:3001/api/products/import \
  -H "X-Seller-Id: seller-123" \
  -F "file=@seed-products.csv"
```

Or use the frontend Import page to upload `seed-products.csv`.

## Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:coverage
```

### Notification Service Tests

```bash
cd notification-service
npm test
npm run test:coverage
```

### Analytics Service Tests

```bash
cd analytics-service
npm test
npm run test:coverage
```

## API Documentation

OpenAPI specification available at:
- File: `docs/openapi.yaml`
- Interactive: `docs/api-docs.html`

### Key Endpoints

**Products**
- `POST /api/products` - Create product
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/import` - CSV bulk import

**Events**
- `GET /api/events/stream` - SSE real-time notifications

**Health**
- `GET /health` - Service health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## Authentication

All API requests require `X-Seller-Id` header:

```bash
curl -H "X-Seller-Id: seller-123" http://localhost:3001/api/products
```

## Environment Variables

### Backend

Create `.env` from `backend/config.env.template`:

```bash
NODE_ENV=development
PORT=3001
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
```

### Frontend

Create `frontend/.env`:

```bash
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:3001
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_FILE_SIZE_MB=10
```

### Notification Service

```bash
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group
DYNAMODB_TABLE_NAME=notifications
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Analytics Service

```bash
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=analytics-service
KAFKA_GROUP_ID=analytics-service-group
DYNAMODB_TABLE_NAME=analytics-metrics
S3_BUCKET_NAME=analytics-archive
```

## Docker Deployment

### Build All Services

```bash
cd backend
docker build --target api-server -t product-api:latest .
docker build --target notification-service -t notification-service:latest .
docker build --target analytics-service -t analytics-service:latest .

cd ../frontend
docker build -t product-frontend:latest .
```

### Run with Docker Compose

```bash
cd backend
docker-compose up -d
```

This starts all infrastructure and application services.

## Production Build

### Backend

```bash
cd backend
npm run build
NODE_ENV=production npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

Build output in `frontend/dist/` - serve with nginx or any static host.

## Monitoring

### Health Checks

```bash
curl http://localhost:3001/health
```

Response includes:
- Service status
- Database connectivity
- Redis connectivity
- Kafka connectivity
- Memory usage
- Uptime

### Logs

```bash
docker-compose logs -f api-server
docker-compose logs -f notification-service
docker-compose logs -f analytics-service
```

## Features

### Backend API
- RESTful API with OpenAPI specification
- PostgreSQL with connection pooling
- Kafka event publishing
- Redis rate limiting (100 req/sec standard, 5 req/min bulk)
- SSE real-time notifications
- CSV streaming import with validation
- Comprehensive error handling

### Frontend
- React 18 + TypeScript
- Real-time SSE notifications
- CSV bulk import with progress
- Product CRUD operations
- Low stock indicators
- Responsive design

### Notification Service
- Kafka consumer for 4 event types
- DynamoDB storage with 30-day TTL
- Redis pub/sub for SSE delivery
- Exponential backoff retry (5 retries)

### Analytics Service
- Worker threads for CPU-intensive aggregation
- Seller metrics (total products, value)
- Category metrics (products, value, avg price)
- Low stock tracking
- DynamoDB hot storage (30-day TTL)
- S3 cold storage archiving

## Helper Scripts

The project includes several shell scripts to simplify service management:

### start-services.sh
Automated production setup and startup:
- Starts Docker infrastructure
- Installs dependencies
- Builds all services
- Starts services in background
- Saves PIDs for cleanup

### start-dev.sh
Development mode with auto-reload:
- Opens each service in separate terminal
- Enables hot-reload for all services
- Ideal for active development

### stop-services.sh
Graceful shutdown:
- Stops all running services
- Optionally stops Docker infrastructure
- Cleans up PID files

### view-logs.sh
Interactive log viewer:
- View logs for individual services
- View combined logs
- View Docker infrastructure logs

All scripts are executable and can be run from the project root:

```bash
./start-services.sh
./start-dev.sh
./stop-services.sh
./view-logs.sh
```

## Project Structure

```
product-management-system/
├── backend/                 # REST API server
│   ├── src/
│   ├── migrations/
│   ├── docker-compose.yml
│   └── Dockerfile
├── frontend/                # React UI
│   ├── src/
│   └── dist/
├── notification-service/    # Event notifications
│   ├── src/
│   └── dist/
├── analytics-service/       # Data aggregation
│   ├── src/
│   └── dist/
├── docs/                    # Documentation
│   ├── openapi.yaml
│   ├── api-docs.html
│   └── architecture-diagram.png
├── ai-prompts/              # Development prompts
├── logs/                    # Service logs
├── seed-products.csv        # Sample data
├── start-services.sh        # Production startup
├── start-dev.sh             # Development startup
├── stop-services.sh         # Shutdown script
├── view-logs.sh             # Log viewer
└── README.md
```

## Troubleshooting

### Kafka Connection Issues

```bash
docker-compose restart kafka zookeeper
docker-compose logs kafka
```

### PostgreSQL Connection Issues

```bash
docker-compose restart postgres
docker exec -it product-management-system-postgres-1 psql -U postgres
```

### Redis Connection Issues

```bash
docker-compose restart redis
docker exec -it product-management-system-redis-1 redis-cli
```

### LocalStack (AWS) Issues

```bash
docker-compose restart localstack
docker-compose logs localstack
```

## License

MIT
