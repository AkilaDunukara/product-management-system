import { connectRedis, disconnectRedis } from './pubsub/redis';
import { startConsumer, stopConsumer } from './consumer';

async function main() {
  console.log('=== Notification Service Starting ===');

  try {
    await connectRedis();
    await startConsumer();

    console.log('=== Notification Service Running ===');
  } catch (error) {
    console.error('Failed to start notification service:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('\n=== Notification Service Shutting Down ===');
  try {
    await stopConsumer();
    await disconnectRedis();
    console.log('=== Notification Service Stopped ===');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

main();

