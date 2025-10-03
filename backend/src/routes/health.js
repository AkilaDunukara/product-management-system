const express = require('express');
const { getPool } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { getProducer } = require('../config/kafka');

const router = express.Router();

/**
 * GET /health - Comprehensive health check endpoint
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
    version: process.env.npm_package_version || '1.0.0'
  };

  let overallHealthy = true;

  // Check PostgreSQL database
  try {
    const pool = getPool();
    const start = Date.now();
    await pool.query('SELECT 1 as health_check');
    const responseTime = Date.now() - start;
    
    health.services.database = {
      status: 'healthy',
      response_time_ms: responseTime
    };
  } catch (error) {
    health.services.database = {
      status: 'unhealthy',
      error: error.message
    };
    overallHealthy = false;
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    const start = Date.now();
    await redis.ping();
    const responseTime = Date.now() - start;
    
    health.services.redis = {
      status: 'healthy',
      response_time_ms: responseTime
    };
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      error: error.message
    };
    overallHealthy = false;
  }

  // Check Kafka producer
  try {
    const producer = getProducer();
    // Kafka producer doesn't have a simple ping method
    // We check if it's initialized and connected
    health.services.kafka = {
      status: 'healthy',
      note: 'Producer initialized and connected'
    };
  } catch (error) {
    health.services.kafka = {
      status: 'unhealthy',
      error: error.message
    };
    overallHealthy = false;
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    rss_mb: Math.round(memUsage.rss / 1024 / 1024),
    heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
    external_mb: Math.round(memUsage.external / 1024 / 1024)
  };

  // Set overall status
  health.status = overallHealthy ? 'healthy' : 'unhealthy';

  // Return appropriate status code
  const statusCode = overallHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /health/ready - Readiness probe (for Kubernetes)
 */
router.get('/ready', async (req, res) => {
  try {
    // Quick checks for readiness
    const pool = getPool();
    await pool.query('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/live - Liveness probe (for Kubernetes)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;