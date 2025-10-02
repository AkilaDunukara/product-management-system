partition = hash(sellerId) % 4
```

### Guarantees
- ✅ **Per-Seller Ordering**: All events from seller-123 are processed in order
- ✅ **Parallel Processing**: seller-123 and seller-456 events can be processed concurrently
- ✅ **Consistency**: Updates to the same product are never reordered

---

## Retry Policies

### Notification Service Policy
```json
{
  "max_retries": 5,
  "initial_retry_delay_ms": 500,
  "backoff_multiplier": 2,
  "max_retry_delay_ms": 10000,
  "dead_letter_queue": "notifications-dlq"
}
```
**Retry Schedule:** 500ms → 1s → 2s → 4s → 8s → DLQ

**Rationale:** Fast retries for real-time notifications to ensure timely delivery to connected SSE clients.

### Analytics Service Policy
```json
{
  "max_retries": 10,
  "initial_retry_delay_ms": 2000,
  "backoff_multiplier": 2,
  "max_retry_delay_ms": 60000,
  "dead_letter_queue": "analytics-dlq"
}
```
**Retry Schedule:** 2s → 4s → 8s → 16s → 32s → 60s → 60s... → DLQ

**Rationale:** More aggressive retries with longer delays for analytics processing, which is less time-sensitive but should not lose data.

---

## Consumer Subscriptions

### Notification Service
- **Consumer Group:** `notification-service-group`
- **Subscribes To:** All events (4 topics)
  - `product.created`
  - `product.updated`
  - `product.deleted`
  - `product.lowstock`
- **Processing Flow:** 
  1. Consumes event from Kafka
  2. Writes notification to DynamoDB
  3. Publishes to Redis Pub/Sub channel (by sellerId)
  4. SSE clients receive real-time updates
- **Guarantee:** At-least-once delivery
- **Retry Policy:** Notification Service (5 retries with fast backoff)
- **Purpose:** Real-time notifications to sellers about product changes and low stock warnings

### Analytics Service
- **Consumer Group:** `analytics-service-group`
- **Subscribes To:** Product lifecycle events (3 topics)
  - `product.created`
  - `product.updated`
  - `product.deleted`
- **Processing Flow:**
  1. Consumes event from Kafka
  2. Processes via Worker Threads (CPU-intensive aggregations)
  3. Writes metrics to DynamoDB (hot storage, 30-day retention)
  4. Archives raw events to S3 (cold storage, long-term retention)
- **Guarantee:** At-least-once delivery
- **Retry Policy:** Analytics Service (10 retries with exponential backoff)
- **Purpose:** Generate analytics, metrics, and reports on product performance

**Note:** LowStockWarning events are only consumed by Notification Service as they are purely notification-driven and don't impact analytics calculations.

---

## Event Schemas

### Base Event Structure

All events inherit from this base structure:

```json
{
  "eventId": "{sellerId}-{productId}-{eventType}-{timestamp}",
  "eventType": "ProductCreated | ProductUpdated | ProductDeleted | LowStockWarning",
  "timestamp": 1696176000000,
  "data": { }
}
```

#### eventId Format
- **Pattern:** `{sellerId}-{productId}-{eventType}-{timestamp}`
- **Example:** `seller-123-12345-ProductCreated-1696176000000`
- **Purpose:** Globally unique identifier for idempotency and deduplication

---

## 1. ProductCreated

### Description
Emitted when a new product is successfully created in the system.

### Kafka Topic
`product.created`

### Trigger
- POST `/products` with valid data

### Consumers
- Notification Service (real-time notifications)
- Analytics Service (metrics and aggregations)

### Schema
```json
{
  "eventId": "seller-123-12345-ProductCreated-1696176000000",
  "eventType": "ProductCreated",
  "timestamp": 1696176000000,
  "data": {
    "productId": 12345,
    "sellerId": "seller-123",
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "price": 29.99,
    "quantity": 150,
    "category": "Electronics",
    "createdAt": "2025-10-02T10:30:00Z",
    "updatedAt": "2025-10-02T10:30:00Z"
  }
}
```

### Example Payloads

#### Example 1: Electronics Product
```json
{
  "eventId": "seller-123-12345-ProductCreated-1696176000000",
  "eventType": "ProductCreated",
  "timestamp": 1696176000000,
  "data": {
    "productId": 12345,
    "sellerId": "seller-123",
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "price": 29.99,
    "quantity": 150,
    "category": "Electronics",
    "createdAt": "2025-10-02T10:30:00Z",
    "updatedAt": "2025-10-02T10:30:00Z"
  }
}
```

#### Example 2: Low Stock Product (triggers LowStockWarning)
```json
{
  "eventId": "seller-456-67890-ProductCreated-1696176030000",
  "eventType": "ProductCreated",
  "timestamp": 1696176030000,
  "data": {
    "productId": 67890,
    "sellerId": "seller-456",
    "name": "USB-C Cable",
    "description": "2-meter USB-C charging cable",
    "price": 12.99,
    "quantity": 8,
    "category": "Accessories",
    "createdAt": "2025-10-02T10:30:30Z",
    "updatedAt": "2025-10-02T10:30:30Z"
  }
}
```

---

## 2. ProductUpdated

### Description
Emitted when an existing product is updated. Includes a `changes` object showing old and new values.

### Kafka Topic
`product.updated`

### Trigger
- PUT `/products/{id}` with valid data

### Consumers
- Notification Service (real-time notifications)
- Analytics Service (metrics recalculation)

### Schema
```json
{
  "eventId": "seller-123-12345-ProductUpdated-1696176060000",
  "eventType": "ProductUpdated",
  "timestamp": 1696176060000,
  "data": {
    "productId": 12345,
    "sellerId": "seller-123",
    "name": "Wireless Mouse Pro",
    "description": "Enhanced ergonomic wireless mouse",
    "price": 34.99,
    "quantity": 120,
    "category": "Electronics",
    "createdAt": "2025-10-02T10:30:00Z",
    "updatedAt": "2025-10-02T10:31:00Z",
    "changes": {
      "name": {
        "old": "Wireless Mouse",
        "new": "Wireless Mouse Pro"
      },
      "price": {
        "old": 29.99,
        "new": 34.99
      },
      "quantity": {
        "old": 150,
        "new": 120
      }
    }
  }
}
```

### Example Payloads

#### Example 1: Price and Name Update
```json
{
  "eventId": "seller-123-12345-ProductUpdated-1696176060000",
  "eventType": "ProductUpdated",
  "timestamp": 1696176060000,
  "data": {
    "productId": 12345,
    "sellerId": "seller-123",
    "name": "Wireless Mouse Pro",
    "description": "Enhanced ergonomic wireless mouse with USB receiver",
    "price": 34.99,
    "quantity": 120,
    "category": "Electronics",
    "createdAt": "2025-10-02T10:30:00Z",
    "updatedAt": "2025-10-02T10:31:00Z",
    "changes": {
      "name": {
        "old": "Wireless Mouse",
        "new": "Wireless Mouse Pro"
      },
      "price": {
        "old": 29.99,
        "new": 34.99
      },
      "quantity": {
        "old": 150,
        "new": 120
      }
    }
  }
}
```

#### Example 2: Quantity Update (triggers LowStockWarning)
```json
{
  "eventId": "seller-789-54321-ProductUpdated-1696176090000",
  "eventType": "ProductUpdated",
  "timestamp": 1696176090000,
  "data": {
    "productId": 54321,
    "sellerId": "seller-789",
    "name": "Bluetooth Headphones",
    "description": "Noise-cancelling wireless headphones",
    "price": 89.99,
    "quantity": 5,
    "category": "Audio",
    "createdAt": "2025-10-01T08:15:00Z",
    "updatedAt": "2025-10-02T10:31:30Z",
    "changes": {
      "quantity": {
        "old": 25,
        "new": 5
      }
    }
  }
}
```

---

## 3. ProductDeleted

### Description
Emitted when a product is soft-deleted from the system.

### Kafka Topic
`product.deleted`

### Trigger
- DELETE `/products/{id}`

### Consumers
- Notification Service (deletion notifications)
- Analytics Service (metrics adjustment)

### Schema
```json
{
  "eventId": "seller-123-12345-ProductDeleted-1696176120000",
  "eventType": "ProductDeleted",
  "timestamp": 1696176120000,
  "data": {
    "productId": 12345,
    "sellerId": "seller-123",
    "name": "Wireless Mouse Pro",
    "category": "Electronics",
    "deletedAt": "2025-10-02T10:32:00Z"
  }
}
```

### Example Payloads

#### Example 1: Standard Deletion
```json
{
  "eventId": "seller-123-12345-ProductDeleted-1696176120000",
  "eventType": "ProductDeleted",
  "timestamp": 1696176120000,
  "data": {
    "productId": 12345,
    "sellerId": "seller-123",
    "name": "Wireless Mouse Pro",
    "category": "Electronics",
    "deletedAt": "2025-10-02T10:32:00Z"
  }
}
```

#### Example 2: Discontinued Product
```json
{
  "eventId": "seller-456-99999-ProductDeleted-1696176150000",
  "eventType": "ProductDeleted",
  "timestamp": 1696176150000,
  "data": {
    "productId": 99999,
    "sellerId": "seller-456",
    "name": "Discontinued Widget",
    "category": "Legacy",
    "deletedAt": "2025-10-02T10:32:30Z"
  }
}
```

---

## 4. LowStockWarning

### Description
Emitted when product quantity falls below threshold (< 10 units). Can be triggered by product creation or update.

### Kafka Topic
`product.lowstock`

### Trigger Conditions
- **On Create:** `quantity < 10`
- **On Update:** `new_quantity < 10 AND old_quantity >= 10`

### Consumers
- Notification Service (real-time low stock alerts)

**Note:** Analytics Service does not consume this event as low stock warnings don't impact historical analytics calculations.

### Schema
```json
{
  "eventId": "seller-456-67890-LowStockWarning-1696176030000",
  "eventType": "LowStockWarning",
  "timestamp": 1696176030000,
  "data": {
    "productId": 67890,
    "sellerId": "seller-456",
    "name": "USB-C Cable",
    "quantity": 8,
    "threshold": 10,
    "category": "Accessories",
    "price": 12.99,
    "previousQuantity": 8
  }
}
```

### Example Payloads

#### Example 1: Created with Low Stock
```json
{
  "eventId": "seller-456-67890-LowStockWarning-1696176030000",
  "eventType": "LowStockWarning",
  "timestamp": 1696176030000,
  "data": {
    "productId": 67890,
    "sellerId": "seller-456",
    "name": "USB-C Cable",
    "quantity": 8,
    "threshold": 10,
    "category": "Accessories",
    "price": 12.99,
    "previousQuantity": 8
  }
}
```

#### Example 2: Quantity Dropped Below Threshold
```json
{
  "eventId": "seller-789-54321-LowStockWarning-1696176090000",
  "eventType": "LowStockWarning",
  "timestamp": 1696176090000,
  "data": {
    "productId": 54321,
    "sellerId": "seller-789",
    "name": "Bluetooth Headphones",
    "quantity": 5,
    "threshold": 10,
    "category": "Audio",
    "price": 89.99,
    "previousQuantity": 25
  }
}
```

#### Example 3: Out of Stock
```json
{
  "eventId": "seller-123-11111-LowStockWarning-1696176200000",
  "eventType": "LowStockWarning",
  "timestamp": 1696176200000,
  "data": {
    "productId": 11111,
    "sellerId": "seller-123",
    "name": "Limited Edition Widget",
    "quantity": 0,
    "threshold": 10,
    "category": "Collectibles",
    "price": 199.99,
    "previousQuantity": 3
  }
}
```

---

## JSON Schema Validation

### Validation Files
- **JSON Schema:** `event-contracts.json`
- **Location:** `/docs/event-contracts.json`

### Validation Usage

#### Node.js (with Ajv)
```javascript
const Ajv = require('ajv');
const eventContracts = require('./docs/event-contracts.json');

const ajv = new Ajv();
const validateProductCreated = ajv.compile(eventContracts.events.ProductCreated.schema);

const isValid = validateProductCreated(event);
if (!isValid) {
  console.error('Validation errors:', validateProductCreated.errors);
}
```

#### TypeScript Type Generation
```bash
npx json-schema-to-typescript docs/event-contracts.json -o src/types/events.d.ts
```

---

## Event Publishing Guidelines

### Producer Best Practices
1. **Always set partition key:** Use `sellerId` to ensure ordering
2. **Include full eventId:** Follow format `{sellerId}-{productId}-{eventType}-{timestamp}`
3. **Use current timestamp:** `Date.now()` in milliseconds
4. **Validate before publishing:** Use JSON Schema validation
5. **Handle failures:** Implement circuit breaker pattern
6. **Log all events:** Include eventId in application logs

### Example Producer Code
```javascript
async function publishProductCreatedEvent(product, sellerId) {
  const timestamp = Date.now();
  const event = {
    eventId: `${sellerId}-${product.id}-ProductCreated-${timestamp}`,
    eventType: 'ProductCreated',
    timestamp,
    data: {
      productId: product.id,
      sellerId,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }
  };

  await kafka.send({
    topic: 'product.created',
    messages: [
      {
        key: sellerId,
        value: JSON.stringify(event),
        headers: {
          'eventType': 'ProductCreated',
          'sellerId': sellerId
        }
      }
    ]
  });
}
```

---

## Event Consumption Guidelines

### Consumer Best Practices
1. **Join correct consumer group:** Use dedicated group per service
2. **Implement idempotency:** Use eventId to detect duplicates
3. **Handle retries gracefully:** Follow retry policies
4. **Process in order:** Within partition, respect message order
5. **Commit after processing:** Use manual offset management
6. **Monitor lag:** Track consumer lag per partition
7. **Dead letter queue:** Send failed events to DLQ after max retries

### Example Consumer Code
```javascript
const consumer = kafka.consumer({ groupId: 'notification-service-group' });

await consumer.subscribe({ 
  topics: ['product.created', 'product.updated', 'product.deleted', 'product.lowstock'] 
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value.toString());
    
    if (await isDuplicate(event.eventId)) {
      console.log(`Skipping duplicate event: ${event.eventId}`);
      return;
    }
    
    try {
      await processEvent(event);
      await markProcessed(event.eventId);
    } catch (error) {
      console.error(`Error processing event ${event.eventId}:`, error);
      throw error;
    }
  }
});
```

---

## Monitoring and Observability

### Key Metrics
- **Producer Metrics:**
  - Events published per second (by topic)
  - Publishing latency (p50, p95, p99)
  - Failed publishes
  
- **Consumer Metrics:**
  - Consumer lag per partition (by service)
  - Processing latency per event type
  - Retry attempts per event
  - Dead letter queue size per service

### Alerting Thresholds
- ⚠️ Consumer lag > 1000 messages
- 🚨 Consumer lag > 10000 messages
- ⚠️ Retry rate > 5%
- 🚨 DLQ messages > 100

---

## Summary

### Event-to-Consumer Matrix

| Event | Notification Service | Analytics Service |
|-------|---------------------|------------------|
| ProductCreated | ✅ Real-time notification | ✅ Metrics calculation |
| ProductUpdated | ✅ Real-time notification | ✅ Metrics recalculation |
| ProductDeleted | ✅ Deletion notification | ✅ Metrics adjustment |
| LowStockWarning | ✅ Urgent alert | ❌ Not consumed |

### Key Features
✅ **2 Core Services:** Notification and Analytics only  
✅ **eventId Format:** `{sellerId}-{productId}-{eventType}-{timestamp}`  
✅ **Ordering:** Guaranteed per seller via Kafka partitioning  
✅ **Retry Policies:** Service-specific (5 for notifications, 10 for analytics)  
✅ **JSON Schema Validation:** Complete schemas for all events  
✅ **Low Stock Threshold:** < 10 units  
✅ **Processing Guarantee:** At-least-once delivery  

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-02 | Initial event contracts release with 2 core services |

---

## References
- [OpenAPI Specification](./openapi.yaml)
- [Architecture Diagram](./architecture-diagram.png)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [JSON Schema Specification](https://json-schema.org/)
```
