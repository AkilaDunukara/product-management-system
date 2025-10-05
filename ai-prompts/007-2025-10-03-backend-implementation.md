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

## AI Response Summary

**Implementation:** Complete Node.js backend (22 files) with:
- 8 REST API endpoints (OpenAPI-compliant)
- Repository pattern (routes → services → repositories)
- PostgreSQL with connection pooling
- Kafka producer for events
- Redis for rate limiting + pub/sub
- SSE for real-time notifications
- CSV streaming with Node.js Streams
- Comprehensive validation (Joi schemas)
- Health checks and error handling

**Architecture Layers:**
1. **Config:** database, kafka, redis
2. **Middleware:** auth (X-Seller-Id), rateLimiter, errorHandler
3. **Repositories:** productRepository (data access)
4. **Services:** productService, csvImportService (business logic)
5. **Routes:** products, events (SSE), health
6. **Validation:** Joi schemas
---

## Human in the Loop

**User Request:**
> "Separate db queries from the service layer to a repository layer"

**Action:** Created `repositories/productRepository.js` for data access separation
