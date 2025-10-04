import csv from 'csv-parser';
import { Transform, Readable } from 'stream';
import productRepository from '../repositories/productRepository';
import { publishEvent } from '../config/kafka';
import { productCreateSchema } from '../validation/productSchemas';
import { Product, ProductCreateData, ImportResult } from '../types';

/**
 * CSV Import Service using Node.js Streams for memory-efficient processing
 * Handles large CSV files with batch processing and validation
 */

class CsvImportService {
  
  /**
   * Process CSV import with streaming and batch processing
   */
  async processImport(sellerId: string, fileBuffer: Buffer): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const results: ImportResult = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };

      let batch: ProductCreateData[] = [];
      const batchSize = 1000;
      const maxErrors = 100; // Limit error collection to prevent memory issues

      // Convert buffer to readable stream
      const fileStream = Readable.from(fileBuffer);

      const validationTransform = new Transform({
        objectMode: true,
        transform: async (chunk: any, encoding: BufferEncoding, callback: Function) => {
          try {
            results.processed++;

            // Validate CSV row
            const { error, value } = productCreateSchema.validate({
              name: chunk.name?.trim(),
              description: chunk.description?.trim() || null,
              price: parseFloat(chunk.price),
              quantity: parseInt(chunk.quantity),
              category: chunk.category?.trim()
            });

            if (error) {
              results.failed++;
              if (results.errors.length < maxErrors) {
                results.errors.push({
                  row: results.processed,
                  error: error.details[0].message,
                  data: chunk
                });
              }
              callback();
              return;
            }

            batch.push(value);

            // Process batch when it reaches batch size
            if (batch.length >= batchSize) {
              try {
                const count = await this.processBatch(sellerId, batch.slice());
                results.successful += count;
                console.log(`✅ Processed batch of ${count} products`);
              } catch (err: any) {
                results.failed += batch.length;
                if (results.errors.length < maxErrors) {
                  results.errors.push({
                    row: Math.floor(results.processed / batchSize),
                    error: err.message
                  });
                }
                console.error('❌ Batch processing failed:', err.message);
              }
              batch = [];
            }

            callback();
          } catch (err: any) {
            results.failed++;
            if (results.errors.length < maxErrors) {
              results.errors.push({
                row: results.processed,
                error: err.message,
                data: chunk
              });
            }
            callback();
          }
        },

        flush: async (callback: Function) => {
          // Process remaining batch
          if (batch.length > 0) {
            try {
              const count = await this.processBatch(sellerId, batch);
              results.successful += count;
              console.log(`✅ Processed final batch of ${count} products`);
            } catch (err: any) {
              results.failed += batch.length;
              if (results.errors.length < maxErrors) {
                results.errors.push({
                  row: results.processed,
                  error: err.message
                });
              }
              console.error('❌ Final batch processing failed:', err.message);
            }
          }

          if (results.errors.length >= maxErrors) {
            results.errors.push({
              row: -1,
              error: `Error limit reached. Only showing first ${maxErrors} errors.`
            });
          }

          resolve(results);
          callback();
        }
      });

      fileStream
        .pipe(csv())
        .pipe(validationTransform)
        .on('error', (error) => {
          console.error('❌ CSV processing error:', error);
          reject(error);
        });
    });
  }

  /**
   * Process a batch of products with database transaction
   */
  private async processBatch(sellerId: string, products: ProductCreateData[]): Promise<number> {
    const insertedProducts = await productRepository.batchInsert(sellerId, products);

    // Publish batch events asynchronously (don't wait)
    this.publishBatchEvents(insertedProducts).catch(error => {
      console.error('❌ Failed to publish batch events:', error);
    });

    return insertedProducts.length;
  }

  /**
   * Publish events for batch of products
   */
  private async publishBatchEvents(products: Product[]): Promise<void> {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
    
    // Group products by seller for batch events
    const productsBySeller: { [key: string]: Product[] } = {};
    const lowStockProducts: Product[] = [];

    products.forEach(product => {
      if (!productsBySeller[product.seller_id]) {
        productsBySeller[product.seller_id] = [];
      }
      productsBySeller[product.seller_id].push(product);

      if (product.quantity < threshold) {
        lowStockProducts.push(product);
      }
    });

    // Publish batch ProductCreated events
    for (const [sellerId, sellerProducts] of Object.entries(productsBySeller)) {
      const batchEvent = {
        eventId: `${sellerId}-batch-ProductCreated-${Date.now()}`,
        eventType: 'ProductCreated',
        timestamp: Date.now(),
        data: {
          sellerId,
          batchSize: sellerProducts.length,
          products: sellerProducts.map(p => ({
            productId: p.id,
            name: p.name,
            price: parseFloat(p.price.toString()),
            quantity: p.quantity,
            category: p.category
          }))
        }
      };

      try {
        await publishEvent('product.created', batchEvent);
        console.log(`📤 Published batch created event for ${sellerProducts.length} products`);
      } catch (error) {
        console.error('❌ Failed to publish batch created event:', error);
      }
    }

    // Publish individual low stock warnings
    for (const product of lowStockProducts) {
      const lowStockEvent = {
        eventId: `${product.seller_id}-${product.id}-LowStockWarning-${Date.now()}`,
        eventType: 'LowStockWarning',
        timestamp: Date.now(),
        data: {
          productId: product.id,
          sellerId: product.seller_id,
          name: product.name,
          quantity: product.quantity,
          threshold,
          message: `Low stock: ${product.name} (${product.quantity} left)`
        }
      };

      try {
        await publishEvent('product.lowstock', lowStockEvent);
      } catch (error) {
        console.error('❌ Failed to publish low stock event:', error);
      }
    }

    if (lowStockProducts.length > 0) {
      console.log(`⚠️ Published ${lowStockProducts.length} low stock warnings`);
    }
  }

  /**
   * Validate CSV headers
   */
  validateHeaders(headers: string[]): boolean {
    const requiredHeaders = ['name', 'price', 'quantity', 'category'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
    }

    return true;
  }

  /**
   * Get import status (placeholder for future implementation)
   */
  async getImportStatus(importId: string): Promise<{ import_id: string; status: string; message: string }> {
    return {
      import_id: importId,
      status: 'completed',
      message: 'Import status tracking not yet implemented'
    };
  }

  /**
   * Cancel import (placeholder for future implementation)
   */
  async cancelImport(importId: string): Promise<{ import_id: string; status: string; message: string }> {
    return {
      import_id: importId,
      status: 'cancelled',
      message: 'Import cancellation not yet implemented'
    };
  }
}

export default new CsvImportService();
