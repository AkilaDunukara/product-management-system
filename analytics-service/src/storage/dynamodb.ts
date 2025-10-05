import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SellerMetrics, CategoryMetrics, LowStockMetrics } from '../types';

const TTL_DAYS = 30;

/**
 * DynamoDB storage service for analytics metrics
 * Stores metrics with TTL for automatic expiration
 */
export class DynamoDBStorage {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
      }
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'analytics-metrics';
  }

  /**
   * Saves seller metrics to DynamoDB with TTL
   */
  async saveSellerMetrics(metrics: Map<string, SellerMetrics>): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + (TTL_DAYS * 24 * 60 * 60);

    for (const [sellerId, metric] of metrics.entries()) {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `SELLER#${sellerId}`,
          SK: `METRICS#${Date.now()}`,
          Type: 'SellerMetrics',
          ...metric,
          TTL: ttl
        }
      }));
    }
  }

  /**
   * Saves category metrics to DynamoDB with TTL
   */
  async saveCategoryMetrics(metrics: Map<string, CategoryMetrics>): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + (TTL_DAYS * 24 * 60 * 60);

    for (const [category, metric] of metrics.entries()) {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `CATEGORY#${category}`,
          SK: `METRICS#${Date.now()}`,
          Type: 'CategoryMetrics',
          ...metric,
          TTL: ttl
        }
      }));
    }
  }

  /**
   * Saves low stock metrics to DynamoDB with TTL
   */
  async saveLowStockMetrics(metrics: LowStockMetrics): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + (TTL_DAYS * 24 * 60 * 60);

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'LOWSTOCK',
        SK: `METRICS#${Date.now()}`,
        Type: 'LowStockMetrics',
        ...metrics,
        TTL: ttl
      }
      }));
  }

  /**
   * Saves all metrics types in parallel for better performance
   */
  async saveAllMetrics(
    sellerMetrics: Map<string, SellerMetrics>,
    categoryMetrics: Map<string, CategoryMetrics>,
    lowStockMetrics: LowStockMetrics
  ): Promise<void> {
    await Promise.all([
      this.saveSellerMetrics(sellerMetrics),
      this.saveCategoryMetrics(categoryMetrics),
      this.saveLowStockMetrics(lowStockMetrics)
    ]);
  }
}
