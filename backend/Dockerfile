# Multi-stage Dockerfile for Node.js services
FROM node:18-alpine AS base

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
COPY src/ ./src/

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# API Server target (default)
FROM base AS api-server
CMD ["node", "src/server.js"]

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