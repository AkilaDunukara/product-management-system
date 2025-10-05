# AI Prompt 003: Architecture Diagram Design and Iterations

## Context

After creating the OpenAPI specification, needed to design a visual architecture for the product management system that:
1. Handles 10k+ RPS throughput
2. Demonstrates advanced Node.js concepts (Worker Threads, Streams)
3. Implements event-driven workflows
4. Uses appropriate storage strategies (hot/cold)
5. Suitable for local development with LocalStack

**Design Goals:**
- Simplicity for demo project
- Realistic production-like architecture
- Clear data flow visualization
- Scalable design patterns

---

## Human in the Loop

**User Iteration 1:**
> "we only need AuthN/Z (document approach only) so we can remove authentication for now and have a auth header that identifies the seller."

**User Iteration 2:**
> "remove clustering and streams and just use worker threads to demonstrate advance node concepts"

**User Iteration 3:**
> "actually we need to have hot storage as dynamo db for the analytics data and later move it to cold storage s3"

**User Iteration 4:**
> "Add support for bulk CSV upload products using file streams, and show me the architecture."

---

## Final Architecture Achieved

✅ Single Node.js API server (no clustering)
✅ Worker Threads for analytics (advanced concept #1)
✅ Streams for CSV import (advanced concept #2)
✅ DynamoDB hot + S3 cold storage
✅ Event-driven with Kafka
✅ Real-time SSE notifications
✅ X-Seller-Id header authentication

**Stream Pipeline:** Multer → CSV Parser → Validation Transform → Batch Transform → DB Writer
