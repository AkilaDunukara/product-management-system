# Multi-stage Dockerfile for Node.js services
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    procps \
    dumb-init

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

FROM node:18-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache \
    dumb-init

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health/live', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# API Server target (default)
CMD ["node", "dist/server.js"]

# Notification Service target
FROM base AS notification-service
# Note: notification service implementation would go here
# For now, it uses the same server but could be separated
CMD ["node", "src/server.js"]

# Analytics Service target
FROM base AS analytics-service
# Note: analytics service implementation would go here
# For now, it uses the same server but could be separated
CMD ["node", "src/server.js"]