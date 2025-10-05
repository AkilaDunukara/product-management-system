import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Notification } from '../types';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localstack:4566',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.NOTIFICATIONS_TABLE || 'notifications';

export async function saveNotification(notification: Notification): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        id: notification.id,
        sellerId: notification.sellerId,
        type: notification.type,
        message: notification.message,
        data: notification.data,
        timestamp: notification.timestamp,
        read: notification.read,
        ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    });

    await docClient.send(command);
    console.log(`[DynamoDB] Saved notification: ${notification.id}`);
  } catch (error) {
    console.warn(`[DynamoDB] Failed to save notification (non-critical):`, error instanceof Error ? error.message : error);
  }
}

