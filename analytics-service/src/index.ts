import { AnalyticsConsumer } from './consumer';

const consumer = new AnalyticsConsumer();

/**
 * Main entry point for analytics service
 */
async function main() {
  try {
    console.log('Starting Analytics Service...');
    await consumer.start();
  } catch (error) {
    console.error('Failed to start analytics service:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await consumer.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await consumer.stop();
  process.exit(0);
});

main();
