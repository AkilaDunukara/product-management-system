const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const testEvents = [
  {
    topic: 'product.created',
    messages: [{
      key: 'seller-1',
      value: JSON.stringify({
        eventId: 'seller-1-100-ProductCreated-' + Date.now(),
        eventType: 'ProductCreated',
        timestamp: Date.now(),
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse',
          price: 29.99,
          quantity: 5,
          category: 'Electronics',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    }]
  },
  {
    topic: 'product.created',
    messages: [{
      key: 'seller-2',
      value: JSON.stringify({
        eventId: 'seller-2-101-ProductCreated-' + Date.now(),
        eventType: 'ProductCreated',
        timestamp: Date.now(),
        data: {
          productId: 101,
          sellerId: 'seller-2',
          name: 'USB Cable',
          description: 'USB-C charging cable',
          price: 12.99,
          quantity: 8,
          category: 'Accessories',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    }]
  },
  {
    topic: 'product.updated',
    messages: [{
      key: 'seller-1',
      value: JSON.stringify({
        eventId: 'seller-1-100-ProductUpdated-' + Date.now(),
        eventType: 'ProductUpdated',
        timestamp: Date.now(),
        data: {
          productId: 100,
          sellerId: 'seller-1',
          name: 'Wireless Mouse Pro',
          description: 'Enhanced ergonomic wireless mouse',
          price: 34.99,
          quantity: 3,
          category: 'Electronics',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          changes: {
            price: { old: 29.99, new: 34.99 },
            quantity: { old: 5, new: 3 }
          }
        }
      })
    }]
  }
];

async function sendTestEvents() {
  try {
    await producer.connect();
    console.log('Producer connected');

    for (const event of testEvents) {
      await producer.send(event);
      console.log(`Sent event to ${event.topic}`);
    }

    await producer.disconnect();
    console.log('Test events sent successfully');
  } catch (error) {
    console.error('Error sending test events:', error);
    process.exit(1);
  }
}

sendTestEvents();
