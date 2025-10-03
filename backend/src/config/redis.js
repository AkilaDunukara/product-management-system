const { createClient } = require('redis');

let redisClient;
let pubClient;
let subClient;

const initializeRedis = async () => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  };

  console.log(`🔗 Connecting to Redis at ${redisConfig.host}:${redisConfig.port}`);

  // Main Redis client for rate limiting
  redisClient = createClient({
    socket: {
      host: redisConfig.host,
      port: redisConfig.port
    },
    password: redisConfig.password
  });

  // Pub/Sub clients for SSE
  pubClient = createClient({
    socket: {
      host: redisConfig.host,
      port: redisConfig.port
    },
    password: redisConfig.password
  });

  subClient = createClient({
    socket: {
      host: redisConfig.host,
      port: redisConfig.port
    },
    password: redisConfig.password
  });

  // Error handlers
  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
  subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

  // Connect all clients
  await Promise.all([
    redisClient.connect(),
    pubClient.connect(),
    subClient.connect()
  ]);

  console.log('✅ All Redis clients connected');
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

const getPubClient = () => {
  if (!pubClient) {
    throw new Error('Redis pub client not initialized. Call initializeRedis() first.');
  }
  return pubClient;
};

const getSubClient = () => {
  if (!subClient) {
    throw new Error('Redis sub client not initialized. Call initializeRedis() first.');
  }
  return subClient;
};

module.exports = {
  initializeRedis,
  getRedisClient,
  getPubClient,
  getSubClient
};