import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;
let pubClient: RedisClientType;
let subClient: RedisClientType;

export const initializeRedis = async (): Promise<void> => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  };

  console.log(`🔗 Connecting to Redis at ${redisConfig.host}:${redisConfig.port}`);

  redisClient = createClient({
    socket: {
      host: redisConfig.host,
      port: redisConfig.port
    },
    password: redisConfig.password
  });

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

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
  subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

  await Promise.all([
    redisClient.connect(),
    pubClient.connect(),
    subClient.connect()
  ]);

  console.log('✅ All Redis clients connected');
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

export const getPubClient = (): RedisClientType => {
  if (!pubClient) {
    throw new Error('Redis pub client not initialized. Call initializeRedis() first.');
  }
  return pubClient;
};

export const getSubClient = (): RedisClientType => {
  if (!subClient) {
    throw new Error('Redis sub client not initialized. Call initializeRedis() first.');
  }
  return subClient;
};
