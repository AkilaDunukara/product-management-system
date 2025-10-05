# AI Prompt 001: OpenAPI Specification

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

## AI Response Summary

Generated comprehensive OpenAPI 3.0 specification (`docs/openapi.yaml`, 888 lines):
- 8 REST endpoints (CRUD + bulk + SSE)
- JWT Bearer authentication
- Rate limiting (100 req/s standard, 5 req/min bulk)
- Pagination, filtering, sorting
- Error responses (400, 401, 404, 429, 500)
- CSV import/export with streaming
- SSE event streaming
- Complete validation rules

**Note:** Later simplified in Prompt 002 (JWT → X-Seller-Id header, removed idempotency/export)