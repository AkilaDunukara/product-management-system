# Project Structure

## Root-Level Organization (Microservices Architecture)

```
product-management-system/
├── backend/                  # API Server (Express.js REST API)
│   ├── src/
│   ├── migrations/
│   ├── __tests__/
│   ├── Dockerfile
│   └── package.json
│
├── notification-service/     # Notification Microservice (Kafka Consumer)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── analytics-service/        # Analytics Microservice (Coming soon)
│   └── ...
│
├── frontend/                 # Frontend Application (Coming soon)
│   └── ...
│
├── docs/                     # API Documentation & Architecture
│   ├── openapi.yaml
│   ├── event-contracts.json
│   └── architecture-diagram.png
│
└── ai-prompts/               # AI Development Prompts (AIDLC)
    └── ...
```

## Service Responsibilities

### 1. backend/ (API Server)
- **Type:** REST API Server
- **Tech:** Node.js + Express + TypeScript
- **Port:** 3001
- **Dependencies:** PostgreSQL, Redis, Kafka
- **Purpose:** 
  - Product CRUD operations
  - CSV import/export
  - SSE event streaming
  - Rate limiting
  - Authentication

### 2. notification-service/ (Independent Microservice)
- **Type:** Event Consumer & Notification Processor
- **Tech:** Node.js + TypeScript
- **Dependencies:** Kafka, Redis, DynamoDB
- **Purpose:**
  - Consume product events from Kafka
  - Transform to notification format
  - Store in DynamoDB (30-day TTL)
  - Publish to Redis pub/sub for SSE delivery

### 3. analytics-service/ (Future)
- **Type:** Analytics Processor with Worker Threads
- **Tech:** Node.js + TypeScript
- **Dependencies:** Kafka, DynamoDB, S3
- **Purpose:**
  - Consume product events
  - Calculate metrics via Worker Threads
  - Store in DynamoDB (hot) and S3 (cold)

## Why Root-Level Services?

### ✅ Advantages

1. **Clear Separation of Concerns**
   - Each service is completely independent
   - No shared code or dependencies
   - Easier to understand boundaries

2. **Independent Deployment**
   - Each service has its own Dockerfile
   - Deploy/scale services independently
   - Different release cycles

3. **Microservices Best Practice**
   - Follows standard microservices architecture patterns
   - Each service can use different tech stack if needed
   - Easier to add new services

4. **Docker Compose Integration**
   - Each service is a separate container
   - Clear service definitions
   - Easier orchestration

5. **Development Experience**
   - Navigate to service root easily
   - Run/test services independently
   - Clear project boundaries

### ❌ Why NOT backend/notification-service?

1. Suggests notification-service is a submodule of backend
2. Confusing when backend API and notification-service are peers
3. Doesn't scale well when adding more services
4. Harder to navigate in monorepo
5. Unclear deployment boundaries

## Current Status

✅ **backend/** - Running (API Server with tests)
✅ **notification-service/** - Running (Moved to root level)
⏳ **analytics-service/** - Not yet implemented
⏳ **frontend/** - Not yet implemented

## Docker Compose Structure

```yaml
services:
  api-server:
    build: ./backend
    ports:
      - "3001:3001"
  
  notification-service:
    build: ./notification-service
    depends_on:
      - kafka
      - redis
      - localstack
  
  analytics-service:
    build: ./analytics-service
    depends_on:
      - kafka
      - localstack
```

## Running Services

### API Server
```bash
cd backend
npm start
```

### Notification Service
```bash
cd notification-service
npm start
```

Each service runs independently and communicates via Kafka, Redis, and DynamoDB.

