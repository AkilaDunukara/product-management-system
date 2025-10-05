const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function sendTestEvent() {
  await producer.connect();
  console.log('Connected to Kafka');

  const testEvent = {
    eventId: 'seller-123-12345-ProductCreated-' + Date.now(),
    eventType: 'ProductCreated',
    timestamp: Date.now(),
    data: {
      productId: 12345,
      sellerId: 'seller-123',
      name: 'Test Wireless Mouse',
      description: 'Test product for notification service',
      price: 29.99,
      quantity: 150,
      category: 'Electronics',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  console.log('Sending test event:', JSON.stringify(testEvent, null, 2));

  await producer.send({
    topic: 'product.created',
    messages: [
      {
        key: 'seller-123',
        value: JSON.stringify(testEvent),
      },
    ],
  });

  console.log('✅ Test event sent successfully!');
  console.log('Check notification-service.log for processing logs');

  await producer.disconnect();
}

sendTestEvent().catch(console.error);

