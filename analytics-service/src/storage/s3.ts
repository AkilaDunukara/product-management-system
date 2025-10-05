import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SellerMetrics, CategoryMetrics, LowStockMetrics } from '../types';

/**
 * S3 storage service for archiving analytics metrics
 */
export class S3Archive {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
      },
      forcePathStyle: true
    });

    this.bucketName = process.env.S3_BUCKET_NAME || 'analytics-archive';
  }

  /**
   * Archives aggregated metrics to S3 in JSON format
   * Organizes files by date for easy retrieval
   */
  async archiveMetrics(
    sellerMetrics: Map<string, SellerMetrics>,
    categoryMetrics: Map<string, CategoryMetrics>,
    lowStockMetrics: LowStockMetrics
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];

    const data = {
      timestamp,
      sellerMetrics: Array.from(sellerMetrics.entries()).map(([id, metrics]) => metrics),
      categoryMetrics: Array.from(categoryMetrics.entries()).map(([id, metrics]) => metrics),
      lowStockMetrics
    };

    const key = `analytics/${date}/${Date.now()}.json`;

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    }));

    console.log(`Archived metrics to S3: ${key}`);
  }
}
