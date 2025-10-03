# AI Prompt 006: Docker Compose Infrastructure Setup

## Context

After completing the PostgreSQL schema design (Prompt 005), needed to create a comprehensive Docker Compose setup for the product management system infrastructure. The system requires multiple services orchestrated together with proper health checks, networking, and data persistence.

**Architecture Requirements:**
- Single Node.js API server (Port 3001)
- PostgreSQL database with migration support
- Redis for rate limiting and SSE pub/sub
- Apache Kafka cluster with Zookeeper
- LocalStack for AWS services (S3, DynamoDB)
- Proper service dependencies and health checks
- Multi-stage Docker builds for Node.js services

## AI Response

### Docker Compose Architecture

**Service Dependencies:**
```
postgres (base) → redis (base) → zookeeper (base)
    ↓                ↓              ↓
api-server ←→ notification-service ←→ kafka
    ↓                ↓              ↓
analytics-service ←→ localstack ←→ kafka-init
```

**Key Features:**

#### 1. Database Layer
- **PostgreSQL 14**: Primary data store with automatic migration
- **Redis 7**: Caching, rate limiting, and pub/sub for SSE
- **Volume Persistence**: Named volumes for data durability

#### 2. Message Streaming
- **Apache Kafka**: Event streaming with 4 partitions
- **Zookeeper**: Kafka cluster coordination
- **Topic Initialization**: Automatic creation of product event topics

#### 3. AWS Services Mock
- **LocalStack**: S3 buckets and DynamoDB tables
- **Initialization Scripts**: Automatic resource creation
- **Service Integration**: Endpoint configuration for Node.js services

#### 4. Application Services
- **API Server**: Main REST API (Port 3001)
- **Notification Service**: Event processing and SSE
- **Analytics Service**: Data aggregation with Worker Threads

#### 5. Infrastructure Features
- **Health Checks**: Comprehensive monitoring for all services
- **Service Dependencies**: Proper startup ordering
- **Network Isolation**: Custom bridge network
- **Volume Management**: Persistent data storage

### Environment Configuration

**Required Variables:**
```env
NODE_ENV=development
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
REDIS_PASSWORD=redis123
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
RATE_LIMIT_STANDARD=100
RATE_LIMIT_BULK=5
LOW_STOCK_THRESHOLD=10
```