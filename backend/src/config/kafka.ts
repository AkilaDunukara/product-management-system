import { Kafka, Producer } from 'kafkajs';
import { KafkaEvent } from '../types';

let producer: Producer;

export const initializeKafka = async (): Promise<void> => {
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'api-server',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
      initialRetryTime: 100,
      retries: 8
    }
  });

  producer = kafka.producer({
    maxInFlightRequests: 1,
    idempotent: true,
    transactionTimeout: 30000
  });

  await producer.connect();
};

export const publishEvent = async (topic: string, event: KafkaEvent): Promise<void> => {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }

  const message = {
    key: event.data.sellerId,
    value: JSON.stringify(event),
    partition: Math.abs(hashCode(event.data.sellerId)) % 4,
    timestamp: Date.now().toString()
  };

  await producer.send({
    topic,
    messages: [message]
  });
};

const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

export const getProducer = (): Producer => {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }
  return producer;
};
