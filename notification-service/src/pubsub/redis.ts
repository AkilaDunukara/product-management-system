import { createClient } from 'redis';
import { Notification } from '../types';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
});

redisClient.on('error', (err) => console.error('[Redis] Error:', err));
redisClient.on('connect', () => console.log('[Redis] Connected'));

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function publishNotification(notification: Notification): Promise<void> {
  const channel = `notifications:${notification.sellerId}`;
  await redisClient.publish(channel, JSON.stringify(notification));
  console.log(`[Redis] Published to ${channel}: ${notification.type}`);
}

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
}

