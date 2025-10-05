# AI Prompt 002: OpenAPI Specification Update for Simplified Architecture

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

## AI Response Summary

**Version Update:** 1.0.0 → 2.0.0

**Changes Applied:**
- ✅ Authentication: JWT Bearer → X-Seller-Id header
- ✅ Added architecture documentation in info section
- ✅ Enhanced CSV import with Streams pipeline details
- ✅ Enhanced SSE endpoint documentation
- ❌ Removed: Idempotency-Key, /products/export endpoint
- ✅ Updated error responses for new auth model

**Result:** Updated `docs/openapi.yaml` aligned with simplified architecture