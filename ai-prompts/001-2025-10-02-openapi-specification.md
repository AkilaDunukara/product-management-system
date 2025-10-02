# AI Prompt 001: OpenAPI Specification

## Metadata
- **Timestamp**: 2025-10-02 14:30:00 UTC
- **Prompt ID**: 001
- **Topic**: OpenAPI 3.0 Specification for Product Management API
- **Outcome**: `docs/openapi.yaml`

---

## Context
Starting the Product Management System project following AIDLC (AI-Driven Development Life Cycle) methodology. This is the foundational artifact that will drive all subsequent implementation.

**Project Requirements:**
- E-commerce product management system
- Event-driven architecture (Kafka)
- Real-time notifications (SSE)
- 10k+ RPS scalability target
- Local development with Docker Compose

---

## User Prompt

I need to create an OpenAPI 3.0 specification for a product management REST API with the following requirements:

**Endpoints:**
- POST /products - Create product
- GET /products - List seller's products (paginated)
- GET /products/{id} - Get single product
- PUT /products/{id} - Update product
- DELETE /products/{id} - Delete product
- POST /products/import - Bulk CSV import
- GET /products/export - CSV export
- GET /events/stream - SSE endpoint for real-time notifications

**Product Schema:**
- id (integer, auto-generated)
- seller_id (string, from JWT)
- name (string, required)
- description (string, optional)
- price (number, required, min 0.01)
- quantity (integer, required, min 0)
- category (string, required)
- created_at (timestamp)
- updated_at (timestamp)

**Authentication:**
- Bearer JWT token
- All endpoints require authentication
- Seller can only access their own products

**Events Emitted:**
- ProductCreated
- ProductUpdated
- ProductDeleted
- LowStockWarning (when quantity < 10)

**Requirements:**
- Include request/response examples
- Define error responses (400, 401, 404, 429, 500)
- Include rate limiting headers
- Document idempotency key header for write operations
- OpenAPI 3.0 format

Generate a complete, production-ready OpenAPI spec.

---

## AI Response

### Summary
Generated a comprehensive OpenAPI 3.0 specification with 888 lines covering:
- 8 REST API endpoints (CRUD + bulk operations + SSE)
- Complete request/response schemas with validation rules
- JWT Bearer authentication
- Error response definitions (400, 401, 404, 429, 500)
- Rate limiting headers (X-RateLimit-*)
- Idempotency support for write operations
- Pagination support
- Multiple examples per endpoint
- SSE event streaming documentation
- CSV import/export specifications

### Key Features Included

**1. Security**
- Bearer JWT authentication on all endpoints
- seller_id extracted from JWT payload
- Row-level security (sellers access only their own products)

**2. Rate Limiting**
- Standard endpoints: 100 req/s per seller
- Bulk operations: 5 req/min per seller
- Global limit: 10,000 req/s
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

**3. Idempotency**
- `Idempotency-Key` header parameter
- 24-hour cache window
- Applicable to POST, PUT, DELETE operations
- UUID format recommended

**4. Pagination**
- Query parameters: page, limit (default: 20, max: 100)
- Response includes: page, limit, total, total_pages
- Filtering: category, min_quantity, max_quantity
- Sorting: sort_by, sort_order

**5. Error Handling**
- Consistent ErrorResponse schema
- Machine-readable error_code field
- Human-readable message field
- Additional details object for validation errors
- Comprehensive examples for each error type

**6. Bulk Operations**
- CSV import: multipart/form-data, 10MB max, 10k rows max
- CSV export: streaming with Content-Disposition header
- Async processing with 202 Accepted response

**7. SSE Notifications**
- text/event-stream content type
- Heartbeat every 30 seconds
- Event types: ProductCreated, ProductUpdated, ProductDeleted, LowStockWarning
- JSON payload in data field

**8. Validation Rules**
- name: 1-255 chars, required
- price: min 0.01, required
- quantity: min 0, required
- category: 1-100 chars, required
- description: max 2000 chars, optional

### Complete OpenAPI Spec
The full specification has been saved to `docs/openapi.yaml` (888 lines).

**Key sections:**
- `info`: API metadata, description, contact, license
- `servers`: Local dev (localhost:3001) and production endpoints
- `paths`: All 8 endpoints with complete documentation
- `components/schemas`: ProductCreateRequest, ProductUpdateRequest, ProductResponse, ProductListResponse, ErrorResponse
- `components/responses`: BadRequest, Unauthorized, NotFound, TooManyRequests, InternalServerError
- `components/parameters`: IdempotencyKey
- `components/headers`: Rate limiting headers
- `components/securitySchemes`: BearerAuth (JWT)