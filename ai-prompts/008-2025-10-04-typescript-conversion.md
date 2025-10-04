# AI Prompt 008: TypeScript Conversion - Backend Migration

## User Prompt

Convert the entire Node.js backend from JavaScript to TypeScript with comprehensive type safety and modern development practices.

**Conversion Requirements:**
- Convert all `.js` files to `.ts` with proper TypeScript syntax
- Add comprehensive type definitions and interfaces
- Implement strict type checking with proper error handling
- Maintain all existing functionality while adding type safety
- Remove JavaScript files that have TypeScript equivalents
- Update build system and development workflow

**TypeScript Features to Implement:**
- Strict type checking with proper interfaces
- Generic types for pagination and error handling
- Union types for error handling scenarios
- Optional properties where appropriate
- Proper async/await typing throughout
- Import/export ES6 modules
- Express.js type extensions for custom request properties

**Files to Convert:**
- Server entry point (`server.js` → `server.ts`)
- Configuration modules (`config/*.js` → `config/*.ts`)
- Middleware (`middleware/*.js` → `middleware/*.ts`)
- Repository layer (`repositories/*.js` → `repositories/*.ts`)
- Service layer (`services/*.js` → `services/*.ts`)
- API routes (`routes/*.js` → `routes/*.ts`)
- Validation schemas (`validation/*.js` → `validation/*.ts`)

**Type Definitions Required:**
- Product interface with all properties
- ProductCreateData and ProductUpdateData interfaces
- ProductFilters interface for query parameters
- PaginationResult generic interface
- ImportResult interface for CSV processing
- KafkaEvent interface for event publishing
- DatabaseConfig interface for connection settings
- Express Request extension for sellerId property

**Build System Updates:**
- Add TypeScript dependencies (`typescript`, `ts-node`, `ts-node-dev`)
- Add type definitions (`@types/node`, `@types/express`, `@types/pg`, etc.)
- Create `tsconfig.json` with strict configuration
- Update `package.json` scripts for TypeScript workflow
- Update Jest configuration for TypeScript testing
- Update Dockerfile for TypeScript compilation

**Development Workflow:**
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Development server with hot reload using ts-node-dev
- `npm start` - Production server (compiled JavaScript)
- `npm test` - Run tests with TypeScript support

**Quality Standards:**
- All functions must have proper return type annotations
- Error handling must use typed interfaces
- Database operations must be type-safe
- API responses must follow defined interfaces
- No `any` types unless absolutely necessary
- Comprehensive JSDoc comments for complex functions

**Key TypeScript Patterns:**
- Use interfaces for object shapes
- Use generics for reusable components
- Use union types for error states
- Use optional chaining and nullish coalescing
- Use proper async/await typing
- Use module augmentation for Express types

**Error Handling:**
- Create typed error interfaces for different error types
- Implement proper error boundaries with type safety
- Use discriminated unions for error states
- Maintain existing error response format with types
