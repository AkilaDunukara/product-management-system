import request from 'supertest';
import express, { Express } from 'express';
import healthRouter from '../../src/routes/health';
import { getPool } from '../../src/config/database';
import { getRedisClient } from '../../src/config/redis';
import { getProducer } from '../../src/config/kafka';

// Mock dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/config/redis');
jest.mock('../../src/config/kafka');

const mockGetPool = getPool as jest.MockedFunction<typeof getPool>;
const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;
const mockGetProducer = getProducer as jest.MockedFunction<typeof getProducer>;

/**
 * Health Routes Tests
 * Test suite for health check and Kubernetes probe endpoints
 */
describe('Health Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRouter);
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when all services are up', async () => {
      const mockPool: any = { query: jest.fn().mockResolvedValue(undefined) };
      const mockRedis: any = { ping: jest.fn().mockResolvedValue(undefined) };
      const mockProducer: any = {};

      mockGetPool.mockReturnValue(mockPool);
      mockGetRedisClient.mockReturnValue(mockRedis);
      mockGetProducer.mockReturnValue(mockProducer);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.database.status).toBe('healthy');
      expect(response.body.services.redis.status).toBe('healthy');
      expect(response.body.services.kafka.status).toBe('healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });

    it('should return unhealthy status when database is down', async () => {
      const mockPool: any = { query: jest.fn().mockRejectedValue(new Error('DB connection failed')) };
      const mockRedis: any = { ping: jest.fn().mockResolvedValue(undefined) };
      const mockProducer: any = {};

      mockGetPool.mockReturnValue(mockPool);
      mockGetRedisClient.mockReturnValue(mockRedis);
      mockGetProducer.mockReturnValue(mockProducer);

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.services.database.status).toBe('unhealthy');
      expect(response.body.services.database.error).toBe('DB connection failed');
    });

    it('should return unhealthy status when Redis is down', async () => {
      const mockPool: any = { query: jest.fn().mockResolvedValue(undefined) };
      const mockRedis: any = { ping: jest.fn().mockRejectedValue(new Error('Redis connection failed')) };
      const mockProducer: any = {};

      mockGetPool.mockReturnValue(mockPool);
      mockGetRedisClient.mockReturnValue(mockRedis);
      mockGetProducer.mockReturnValue(mockProducer);

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.services.redis.status).toBe('unhealthy');
      expect(response.body.services.redis.error).toBe('Redis connection failed');
    });

    it('should include response times for healthy services', async () => {
      const mockPool: any = { query: jest.fn().mockResolvedValue(undefined) };
      const mockRedis: any = { ping: jest.fn().mockResolvedValue(undefined) };
      const mockProducer: any = {};

      mockGetPool.mockReturnValue(mockPool);
      mockGetRedisClient.mockReturnValue(mockRedis);
      mockGetProducer.mockReturnValue(mockProducer);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.services.database).toHaveProperty('response_time_ms');
      expect(response.body.services.redis).toHaveProperty('response_time_ms');
      expect(typeof response.body.services.database.response_time_ms).toBe('number');
      expect(typeof response.body.services.redis.response_time_ms).toBe('number');
    });

    it('should include memory usage information', async () => {
      const mockPool: any = { query: jest.fn().mockResolvedValue(undefined) };
      const mockRedis: any = { ping: jest.fn().mockResolvedValue(undefined) };
      const mockProducer: any = {};

      mockGetPool.mockReturnValue(mockPool);
      mockGetRedisClient.mockReturnValue(mockRedis);
      mockGetProducer.mockReturnValue(mockProducer);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.memory).toHaveProperty('rss_mb');
      expect(response.body.memory).toHaveProperty('heap_used_mb');
      expect(response.body.memory).toHaveProperty('heap_total_mb');
      expect(response.body.memory).toHaveProperty('external_mb');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when database is available', async () => {
      const mockPool: any = { query: jest.fn().mockResolvedValue(undefined) };
      mockGetPool.mockReturnValue(mockPool);

      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return not ready status when database is unavailable', async () => {
      const mockPool: any = { query: jest.fn().mockRejectedValue(new Error('DB not ready')) };
      mockGetPool.mockReturnValue(mockPool);

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body.status).toBe('not ready');
      expect(response.body.error).toBe('DB not ready');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should always return alive status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });
});

