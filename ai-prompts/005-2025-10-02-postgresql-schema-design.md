# AI Prompt 005: PostgreSQL Database Schema Design

## Context

After defining event contracts (Prompt 004), needed to create the PostgreSQL database schema to support the product management system. The schema must handle high-throughput operations (10k+ RPS), event sourcing, and notification tracking.

**Architecture Requirements:**
- Single PostgreSQL database for product data
- Event sourcing table for audit trail and idempotency
- Notification tracking for SSE delivery
- Soft delete support for products
- Optimized for seller-scoped queries

---

## User Requirements

**Initial Request:**
```
Based on docs/openapi.yaml, generate PostgreSQL schema for:

products (id, seller_id, name, description, price, quantity, category, created_at, updated_at)

Requirements:
- Proper indexes for performance (seller_id, product_id lookups)
- Timestamps with defaults
- Up/down migrations

Generate init-db.sql with all tables, indexes, and constraints.
```

**Human in the loop:**
```
remove the comment in the generated sql file
```

```
Add indexes to necessary fields only
```

```
init-db.sql and 001_up_initial_schema are more or less same, why do we need both of those files? keep only the migration files
```

## AI Response

### Final Database Schema

Created three interconnected tables with minimal necessary indexes:

#### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    seller_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes (2):**
- `idx_products_seller_id` on `seller_id` WHERE `deleted_at IS NULL`
- `idx_products_seller_category` on `seller_id, category` WHERE `deleted_at IS NULL`

