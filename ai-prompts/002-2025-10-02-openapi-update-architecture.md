# AI Prompt 002: OpenAPI Specification Update for Simplified Architecture

## Metadata
- **Timestamp**: 2025-10-02 15:45:00 UTC
- **Prompt ID**: 002
- **Topic**: OpenAPI 3.0 Update for New Simplified Architecture
- **Outcome**: Updated `docs/openapi.yaml` (v2.0.0)
- **Status**: ✅ Accepted

---

## Context

After initial OpenAPI spec creation (Prompt 001), the architecture was simplified based on demo project requirements:

**Architecture Changes:**
1. **Removed Clustering** - Single Node.js API server instead of clustered workers
2. **Kept Worker Threads** - For CPU-intensive analytics (advanced Node.js concept)
3. **Added Streams** - CSV bulk import using Node.js Streams (advanced Node.js concept)
4. **Simplified Auth** - X-Seller-Id header instead of JWT Bearer tokens
5. **Removed Idempotency** - Not needed for demo scope
6. **Removed Export** - Only import needed (demonstrates Streams)
7. **Added Storage Strategy** - DynamoDB hot storage (30 days) + S3 cold storage (historical)

**Final Tech Stack:**
- Node.js API Server (single process, Port 3001)
- PostgreSQL (products database)
- Redis (rate limiting + SSE pub/sub)
- Apache Kafka (event streaming, 4 partitions)
- DynamoDB (analytics hot storage)
- S3 (analytics cold storage)

---

## AI Response

### Overview of Changes

**Version Update:** 1.0.0 → 2.0.0 (breaking changes in authentication)

**Key Modifications:**

#### 1. Authentication Simplification

#### 2. Architecture Documentation in Info Section

#### 3. CSV Import Enhancement (`/products/import`)

#### 4. SSE Endpoint Enhancement (`/events/stream`)

#### 5. Removed Components
- ❌ `Idempotency-Key` parameter from all write operations
- ❌ `/products/export` endpoint
- ❌ Bearer token authentication references
```
#### 6. Updated Error Responses

#### 7. Enhanced Endpoint Descriptions

## Generated OpenAPI Spec Highlights