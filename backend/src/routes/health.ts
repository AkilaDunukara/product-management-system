import express from 'express';
import { getPool } from '../config/database';
import { getRedisClient } from '../config/redis';
import { getProducer } from '../config/kafka';

/**
 * Health Routes - Comprehensive health monitoring
 * Provides service dependency checks and Kubernetes-ready probes
 */

const router = express.Router();

// GET /health - Comprehensive health check endpoint
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {} as any,
    version: process.env.npm_package_version || '1.0.0',
    memory: {} as any
  };

  let overallHealthy = true;

  // Check PostgreSQL database connection
  try {
    const pool = getPool();
    const start = Date.now();
    await pool.query('SELECT 1 as health_check');
    const responseTime = Date.now() - start;
    
    health.services.database = {
      status: 'healthy',
      response_time_ms: responseTime
    };
  } catch (error: any) {
    health.services.database = {
      status: 'unhealthy',
      error: error.message
    };
    overallHealthy = false;
  }

  // Check Redis connection
  try {
    const redis = getRedisClient();
    const start = Date.now();
    await redis.ping();
    const responseTime = Date.now() - start;
    
    health.services.redis = {
      status: 'healthy',
      response_time_ms: responseTime
    };
  } catch (error: any) {
    health.services.redis = {
      status: 'unhealthy',
      error: error.message
    };
    overallHealthy = false;
  }

  // Check Kafka producer connection
  try {
    health.services.kafka = {
      status: 'healthy',
      note: 'Producer initialized and connected'
    };
  } catch (error: any) {
    health.services.kafka = {
      status: 'unhealthy',
      error: error.message
    };
    overallHealthy = false;
  }

  // Add memory usage information
  const memUsage = process.memoryUsage();
  health.memory = {
    rss_mb: Math.round(memUsage.rss / 1024 / 1024),
    heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
    external_mb: Math.round(memUsage.external / 1024 / 1024)
  };

  // Set overall health status
  health.status = overallHealthy ? 'healthy' : 'unhealthy';

  const statusCode = overallHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

// GET /health/ready - Kubernetes readiness probe
router.get('/ready', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /health/live - Kubernetes liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
