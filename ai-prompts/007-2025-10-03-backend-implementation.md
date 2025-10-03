# AI Prompt 007: Backend Implementation - Node.js API Server

## User Prompt

Implement the complete Node.js backend server based on the OpenAPI specification with the following requirements:

**Core Features:**
- REST API endpoints: products CRUD, CSV import/export, SSE events, health checks
- Authentication via X-Seller-Id header
- Rate limiting with Redis (100 req/s standard, 5 req/min bulk)
- Event publishing to Kafka (ProductCreated, ProductUpdated, ProductDeleted, LowStockWarning)
- Real-time notifications via Server-Sent Events
- CSV streaming import with batch processing
- Comprehensive input validation using Joi schemas

**Architecture Patterns:**
- Repository pattern for data access layer
- Service layer for business logic
- Middleware for cross-cutting concerns
- Configuration modules for external services
- Structured error handling

**Infrastructure Integration:**
- PostgreSQL with connection pooling and transactions
- Kafka producer with consistent partitioning
- Redis for rate limiting and pub/sub
- Docker multi-stage builds
- Environment-based configuration

**Quality Requirements:**
- Production-ready error handling
- Memory-efficient CSV processing
- Graceful shutdown handling
- Comprehensive health checks
- Security best practices

---

## AI Response

### Implementation Summary

Created a complete Node.js backend with 22 files implementing:
- **8 REST API endpoints** matching OpenAPI specification exactly
- **Repository Pattern** with clean separation of concerns
- **Event-driven architecture** with Kafka integration
- **Real-time capabilities** via Redis pub/sub and SSE
- **Production-ready features** including rate limiting, health checks, and error handling

### Key Components Implemented

#### 1. Server Architecture (`src/server.js`)
- Express.js application with security middleware (helmet, cors, compression)
- Service initialization (PostgreSQL, Kafka, Redis)
- Graceful shutdown handling with cleanup
- Comprehensive error handling for uncaught exceptions
- Structured logging with emojis for better visibility

#### 2. Configuration Layer (`src/config/`)
**Database Configuration (`database.js`):**
- PostgreSQL connection pooling (max 20 connections)
- Connection retry logic with exponential backoff
- Health check queries for monitoring
- Proper connection lifecycle management

**Kafka Configuration (`kafka.js`):**
- KafkaJS producer with consistent partitioning
- Topic creation and management
- Error handling and reconnection logic
- Event publishing with seller-based partitioning

**Redis Configuration (`redis.js`):**
- Dual Redis clients (rate limiting + pub/sub)
- Connection health monitoring
- Automatic reconnection handling
- Pub/sub setup for SSE notifications

#### 3. Middleware Layer (`src/middleware/`)
**Authentication (`auth.js`):**
- X-Seller-Id header validation
- Request context enhancement
- Error handling for missing/invalid headers

**Rate Limiting (`rateLimiter.js`):**
- Redis-based sliding window algorithm
- Different limits for standard (100/s) and bulk (5/min) operations
- Automatic cleanup of expired entries
- Detailed rate limit headers in responses

**Error Handling (`errorHandler.js`):**
- Centralized error processing
- Structured error responses matching OpenAPI spec
- Different handling for validation, database, and system errors
- Security-conscious error message sanitization

#### 4. Data Access Layer (`src/repositories/`)
**Product Repository (`productRepository.js`):**
- Complete CRUD operations with PostgreSQL
- Advanced filtering and pagination
- Soft delete implementation
- Transaction support for data consistency
- Optimized queries with proper indexing considerations

#### 5. Business Logic Layer (`src/services/`)
**Product Service (`productService.js`):**
- Business logic orchestration
- Event publishing to Kafka
- Low stock warning detection
- Data transformation and validation

**CSV Import Service (`csvImportService.js`):**
- Memory-efficient streaming with Node.js Streams
- Batch processing (1000 rows per batch)
- Comprehensive validation with detailed error reporting
- Backpressure handling for large files
- Async processing with immediate 202 response

#### 6. Validation Layer (`src/validation/`)
**Product Schemas (`productSchemas.js`):**
- Joi validation schemas matching OpenAPI specification
- Detailed error messages for better developer experience
- Custom validation rules for business logic
- Request/response validation separation

#### 7. API Routes (`src/routes/`)
**Product Routes (`products.js`):**
- Complete REST API implementation (GET, POST, PUT, DELETE)
- CSV import/export endpoints
- Proper HTTP status codes and response formatting
- Input validation and error handling
- Pagination and filtering support

**Event Routes (`events.js`):**
- Server-Sent Events implementation
- Redis pub/sub integration for real-time notifications
- Connection management and heartbeat
- Proper SSE formatting with event types

**Health Routes (`health.js`):**
- Comprehensive health monitoring
- Service dependency checks (PostgreSQL, Redis, Kafka)
- Memory usage reporting
- Kubernetes-ready liveness/readiness probes

#### 8. Infrastructure Files
**Package Configuration (`package.json`):**
- Production dependencies (Express, PostgreSQL, Kafka, Redis)
- Development tools (nodemon, jest)
- Proper Node.js version requirements
- Startup scripts and commands

**Docker Configuration (`Dockerfile`):**
- Multi-stage builds for different services
- Security-hardened non-root user
- Optimized layer caching
- Production-ready image size optimization

**Environment Template (`config.env.template`):**
- Complete environment variable documentation
- Secure defaults for development
- Production deployment guidance

**Setup Script (`setup.sh`):**
- Automated environment setup
- Database migration support
- Service health verification

Human in the loop
Separate db queries from the service layer to a repository layer

### File Structure
```
backend/
├── src/
│   ├── server.js                    # Main application entry
│   ├── config/                      # Service configurations
│   │   ├── database.js             # PostgreSQL setup
│   │   ├── kafka.js                # Kafka producer
│   │   └── redis.js                # Redis clients
│   ├── middleware/                  # Express middleware
│   │   ├── auth.js                 # Authentication
│   │   ├── rateLimiter.js          # Rate limiting
│   │   └── errorHandler.js         # Error handling
│   ├── repositories/                # Data access layer
│   │   └── productRepository.js    # Product operations
│   ├── services/                    # Business logic
│   │   ├── productService.js       # Product management
│   │   └── csvImportService.js     # CSV processing
│   ├── validation/                  # Input validation
│   │   └── productSchemas.js       # Joi schemas
│   └── routes/                      # API endpoints
│       ├── products.js             # Product CRUD
│       ├── events.js               # SSE endpoint
│       └── health.js               # Health checks
├── migrations/                      # Database migrations
├── package.json                     # Dependencies
├── Dockerfile                       # Multi-service builds
├── config.env.template             # Environment template
├── setup.sh                        # Setup automation
└── README.md                       # Documentation
```
