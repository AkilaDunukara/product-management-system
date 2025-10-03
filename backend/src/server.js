const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const { initializeKafka } = require('./config/kafka');
const { initializeRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const authMiddleware = require('./middleware/auth');

// Import routes
const productRoutes = require('./routes/products');
const eventRoutes = require('./routes/events');
const healthRoutes = require('./routes/health');

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

// Routes
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

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting Product Management API...');

    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connected');

    // Initialize Kafka producer
    await initializeKafka();
    console.log('✅ Kafka producer connected');

    // Initialize Redis connection
    await initializeRedis();
    console.log('✅ Redis connected');

    // Start server
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

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
  
  try {
    // Add cleanup logic here if needed
    console.log('✅ Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();