import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

// Import configuration
import { initializeDatabase } from './config/database';
import { initializeKafka } from './config/kafka';
import { initializeRedis } from './config/redis';

// Import middleware
import errorHandler from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';
import authMiddleware from './middleware/auth';

// Import routes
import productRoutes from './routes/products';
import eventRoutes from './routes/events';
import healthRoutes from './routes/health';

/**
 * Product Management API Server
 * Express.js application with event-driven architecture
 */

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(rateLimiter);

// Authentication middleware for API routes
app.use('/api', authMiddleware);

// API routes
app.use('/api/products', productRoutes);
app.use('/api/events', eventRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Product Management API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: 'See OpenAPI specification'
    }
  });
});

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Initialize all services and start the server
 */

async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting Product Management API...');

    // Initialize all services
    await initializeDatabase();
    console.log('✅ Database connected');

    await initializeKafka();
    console.log('✅ Kafka producer connected');

    await initializeRedis();
    console.log('✅ Redis connected');

    app.listen(PORT, () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
  
  try {
    console.log('✅ Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
