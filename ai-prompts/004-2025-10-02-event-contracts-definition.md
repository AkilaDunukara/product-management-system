# AI Prompt 004: Event Contracts Definition for Product Management System

**Initial Request:**
```
Define and create JSON schema contracts for all events in the product management system:

Events:
1. ProductCreated
2. ProductUpdated
3. ProductDeleted
4. LowStockWarning

Requirements:
- Each event must have: eventId, eventType, timestamp, data
- eventId format: {sellerId}-{productId}-{eventType}-{timestamp}
- Include JSON Schema for validation
- Provide example payloads
- Document which consumers subscribe to each event
- Define retry policies
- Specify ordering guarantees (by sellerId partition)
```

Human in the loop
```
requirement is only for 2 services notification_service and analytics_service.
Remove additional services
```

---accepted

## AI Response

### Initial Approach

Created comprehensive event contracts with:
1. **4 Consumer Services** (initial design):
   - notification_service
   - analytics_service
   - inventory_service (extra)
   - audit_log_service (extra)

**User Feedback:** Only 2 services needed for core requirements.

### Final Solution

Simplified to **2 Core Services**:

#### 1. Notification Service
- **Subscribes To:** All 4 event types
- **Purpose:** Real-time notifications via SSE
- **Flow:** Kafka → DynamoDB → Redis Pub/Sub → SSE clients
- **Retry Policy:** 5 retries, fast backoff (500ms initial)

#### 2. Analytics Service
- **Subscribes To:** 3 lifecycle events (ProductCreated, ProductUpdated, ProductDeleted)
- **Purpose:** Metrics, aggregations, and historical analytics
- **Flow:** Kafka → Worker Threads → DynamoDB (hot) → S3 (cold)
- **Retry Policy:** 10 retries, longer backoff (2s initial)
- **Note:** Does NOT consume LowStockWarning (purely notification-driven)


## Summary

### Deliverables
✅ **event-contracts.json** - Complete JSON Schema definitions  
✅ **event-contracts.md** - Comprehensive documentation  

### Event-to-Consumer Matrix

| Event | Notification Service | Analytics Service |
|-------|---------------------|------------------|
| ProductCreated | ✅ Real-time notification | ✅ Metrics calculation |
| ProductUpdated | ✅ Real-time notification | ✅ Metrics recalculation |
| ProductDeleted | ✅ Deletion notification | ✅ Metrics adjustment |
| LowStockWarning | ✅ Urgent alert | ❌ Not consumed |

