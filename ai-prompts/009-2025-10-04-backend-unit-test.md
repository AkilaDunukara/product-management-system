# AI Prompt 009: Backend Unit Testing Implementation with SSE Testing Fix

## User Prompt

Implement comprehensive unit testing for the TypeScript backend with full test coverage across all layers (middleware, routes, services) and fix the failing Server-Sent Events (SSE) test suite.

## Part 1: Comprehensive Unit Testing Implementation

**Objective:**

Create a complete unit testing suite for the backend using Jest and TypeScript, covering all layers of the application with proper mocking, assertions, and edge case handling.

**Testing Requirements:**

1. **Test Framework Setup**
   - Configure Jest with TypeScript support (ts-jest)
   - Set up global test environment and mocks
   - Configure code coverage reporting
   - Create test utilities and helpers

2. **Testing Layers Required**
   - ✅ Middleware layer (auth, error handling, rate limiting)
   - ✅ Routes layer (products, events, health endpoints)
   - ✅ Services layer (product business logic, CSV import)
   - ✅ Integration between layers

**Test Structure:**

```
backend/__tests__/
├── middleware/
│   ├── auth.test.ts
│   ├── errorHandler.test.ts
│   └── rateLimiter.test.ts
├── routes/
│   ├── products.test.ts
│   ├── events.test.ts
│   └── health.test.ts
└── services/
    ├── productService.test.ts
    └── csvImportService.test.ts

**Testing Patterns:**

### 1. Middleware Tests

**Auth Middleware:**
- Validate X-Seller-Id header presence
- Test valid seller ID formats
- Test invalid/missing seller IDs
- Test error responses

**Error Handler:**
- Validation errors (400)
- Not found errors (404)
- Internal server errors (500)
- Kafka/Redis connection errors
- Custom error formatting

**Rate Limiter:**
- Standard endpoint limiting
- Bulk operation limiting
- Rate limit exceeded scenarios
- Rate limit reset behavior

### 2. Route Tests (using supertest)

**Products Routes:**
- POST /products - Create product
- GET /products - List with pagination
- GET /products/:id - Get single product
- PUT /products/:id - Update product
- DELETE /products/:id - Delete product
- POST /products/bulk-import - CSV upload
- Test validation errors
- Test not found scenarios
- Test seller isolation

**Health Routes:**
- GET /health - Overall health
- GET /health/postgres - Database health
- GET /health/redis - Cache health
- GET /health/kafka - Message broker health
- Test degraded states
- Test critical failures

### 3. Service Tests (with mocking)

**Product Service:**
- Create product with event publishing
- Update product with low stock detection
- Delete product with event publishing
- Get operations with proper formatting
- Kafka event publishing (mocked)
- Low stock threshold checks
- Error handling in event publishing

**CSV Import Service:**
- Valid CSV parsing and processing
- Validation error handling
- Batch processing (50 products at a time)
- Malformed CSV handling
- Event publishing for bulk operations
- Progress tracking
- Error aggregation

**Mocking Strategy:**
- Mock database repositories
- Mock Kafka producer
- Mock Redis clients
- Mock external dependencies
- Use jest.mock() for modules
- Create typed mocks for TypeScript

**Test Coverage Goals:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Part 2: SSE Testing Fix

**Problem Statement:**

Four tests in `backend/__tests__/routes/events.test.ts` are timing out:
- "should establish SSE connection"
- "should handle Redis subscription errors"
- "should send notifications to client"
- "should handle malformed notification messages"

**Root Cause:**

Server-Sent Events (SSE) is a streaming protocol where:
- The HTTP connection remains open indefinitely
- Data is sent in chunks over time (not a complete response)
- The response never "ends" in the traditional HTTP sense

`supertest` is designed for request-response patterns:
- It waits for the response to complete (the `end` event)
- It buffers the entire response internally
- It cannot handle streaming responses that never complete
- Data event callbacks don't fire as expected

**SSE-Specific Solution Requirements:**

1. **Migrate from supertest to native Node.js http module**
   - Use Node.js built-in `http.request()` for raw HTTP access
   - Direct control over streaming response handling
   - Real-time data chunk reception
   - Proper connection lifecycle management

2. **Update test infrastructure**
   - Create real HTTP server instances for tests
   - Listen on random ports to avoid conflicts
   - Properly clean up servers after each test
   - Handle connection errors gracefully

3. **Maintain test coverage**
   - Keep all existing test scenarios
   - Ensure proper assertions for SSE format
   - Test connection establishment
   - Test error handling
   - Test notification delivery
   - Test malformed message handling

**Implementation Details:**

### Test Setup Pattern

```typescript
let server: http.Server;
let port: number;

beforeEach((done) => {
  app = express();
  // ... setup middleware
  
  server = app.listen(0, () => {
    port = (server.address() as any).port;
    done();
  });
});

afterEach((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});
```

### HTTP Request Pattern

```typescript
const req = http.request({
  hostname: 'localhost',
  port: port,
  path: '/events/stream',
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream'
  }
}, (res) => {
  // Immediate callback when headers received
  expect(res.statusCode).toBe(200);
  
  let dataReceived = '';
  
  res.on('data', (chunk: Buffer) => {
    // Real-time data chunk handling
    dataReceived += chunk.toString();
    
    if (/* condition met */) {
      clearTimeout(timeout);
      req.destroy();
      done();
    }
  });
});

req.end();
```

### SSE Response Enhancement

Add `res.flush()` calls after each `res.write()` to ensure immediate data transmission:

```typescript
res.write(`data: ${JSON.stringify(message)}\n\n`);
if (res.flush) {
  res.flush();
}
```

**Files to Modify:**

1. `backend/__tests__/routes/events.test.ts`
   - Replace `request(app)` with native `http.request()`
   - Add server lifecycle management in beforeEach/afterEach
   - Update all test cases to use streaming pattern
   - Add proper timeout handling
   - Add proper connection cleanup

2. `backend/src/routes/events.ts`
   - Add `res.flush()` calls after each `res.write()`
   - Add safety check: `if (res.flush) { res.flush(); }`
   - Add inline documentation comments
   - No functional changes to SSE behavior

**Key Differences: Supertest vs Native HTTP**

| Aspect | Supertest | Native http |
|--------|-----------|-------------|
| **Use Case** | REST APIs (request-response) | Streaming responses (SSE, WebSocket) |
| **Response Handling** | Buffers entire response | Real-time chunks |
| **Connection** | Auto-closes after response | Manual lifecycle control |
| **Server** | Virtual (no real port) | Real server on actual port |
| **Data Events** | Internal buffering | Direct stream access |
| **Best For** | POST, GET, PUT, DELETE | SSE, streaming, long-polling |

**When to Use Each:**

- ✅ **Keep supertest for:** Standard REST endpoints (products, health, etc.)
- ✅ **Use native http for:** SSE, WebSockets, streaming responses


**Deliverables:**

1. **Jest Configuration**
   - ✅ `jest.config.js` - TypeScript test configuration
   - ✅ `jest.setup.js` - Global test setup and mocks
   - ✅ Coverage reporting configured

2. **Test Files Created (8 test suites)**
   - ✅ `__tests__/middleware/auth.test.ts` - Auth middleware tests
   - ✅ `__tests__/middleware/errorHandler.test.ts` - Error handling tests
   - ✅ `__tests__/middleware/rateLimiter.test.ts` - Rate limiting tests
   - ✅ `__tests__/routes/products.test.ts` - Product API tests
   - ✅ `__tests__/routes/health.test.ts` - Health check tests
   - ✅ `__tests__/routes/events.test.ts` - SSE streaming tests (with native http)
   - ✅ `__tests__/services/productService.test.ts` - Product business logic tests
   - ✅ `__tests__/services/csvImportService.test.ts` - CSV import tests

3. **Dependencies Added**
   - `jest` - Testing framework
   - `ts-jest` - TypeScript support for Jest
   - `@types/jest` - TypeScript definitions
   - `supertest` - HTTP testing (for REST endpoints)
   - `@types/supertest` - TypeScript definitions

4. **NPM Scripts**
   ```json
   {
     "test": "jest",
     "test:watch": "jest --watch",
     "test:coverage": "jest --coverage"
   }
   ```

**Test Statistics:**

- **Total Test Suites:** 8
- **Total Test Cases:** ~50+
- **Code Coverage:** > 80% across all metrics
- **Testing Tools:** Jest, ts-jest, supertest, native http

**Key Testing Principles Applied:**

1. ✅ **Isolation** - Each test is independent and isolated
2. ✅ **Mocking** - External dependencies properly mocked
3. ✅ **Coverage** - High coverage across all layers
4. ✅ **Readability** - Clear test descriptions and structure
5. ✅ **Maintainability** - DRY principle with proper setup/teardown
6. ✅ **Real-world scenarios** - Edge cases and error conditions tested
7. ✅ **TypeScript safety** - Fully typed tests and mocks
8. ✅ **Documentation** - JSDoc comments for complex test suites

**Running Tests:**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create product"
```

**Technical Notes:**

- SSE format: `data: {JSON}\n\n` or `event: type\ndata: {JSON}\n\n`
- Heartbeat pattern: `: heartbeat\n\n` (comment, keeps connection alive)
- Connection stays open until client closes or error occurs
- Redis pub/sub integration remains unchanged
- Notification flow: Kafka → Notification Service → Redis → SSE Client

**Benefits of This Approach:**

1. ✅ Proper streaming test coverage
2. ✅ Tests reflect real-world SSE behavior
3. ✅ Direct access to HTTP stream events
4. ✅ No artificial timeouts or workarounds
5. ✅ Clear separation: REST tests use supertest, streaming tests use http
6. ✅ Better understanding of HTTP streaming protocols

**Learning Points:**

- SSE is fundamentally different from REST
- Streaming responses require streaming test tools
- Supertest excels at REST, native http excels at streaming
- Always match your testing tool to the protocol pattern
- Not all HTTP testing libraries support all HTTP patterns
- Understanding protocol fundamentals helps choose the right tools

