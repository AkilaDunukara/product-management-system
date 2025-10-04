import productRepository from '../repositories/productRepository';
import { publishEvent } from '../config/kafka';
import { Product, ProductCreateData, ProductUpdateData, ProductFilters, PaginationResult } from '../types';

/**
 * Product service handling all product-related business logic
 * Includes CRUD operations, event publishing, and data formatting
 */
class ProductService {
  
  /**
   * Create a new product
   */
  async createProduct(sellerId: string, productData: ProductCreateData): Promise<Product> {
    const product = await productRepository.create(sellerId, productData);

    await this.publishProductEvent('product.created', 'ProductCreated', product);

    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
    if (product.quantity < threshold) {
      await this.publishLowStockEvent(product);
    }

    return this.formatProduct(product);
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(sellerId: string, filters: ProductFilters): Promise<PaginationResult<Product>> {
    const [products, total] = await Promise.all([
      productRepository.findBySeller(sellerId, filters),
      productRepository.countBySeller(sellerId, filters)
    ]);

    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: products.map(this.formatProduct),
      pagination: {
        page: filters.page || 1,
        limit,
        total,
        total_pages: totalPages
      }
    };
  }

  /**
   * Get a single product by ID
   */
  async getProductById(sellerId: string, productId: number): Promise<Product | null> {
    const product = await productRepository.findByIdAndSeller(productId, sellerId);
    
    if (!product) {
      return null;
    }

    return this.formatProduct(product);
  }

  /**
   * Update an existing product
   */
  async updateProduct(sellerId: string, productId: number, updateData: ProductUpdateData): Promise<Product | null> {
    const { current, updated } = await productRepository.updateByIdAndSeller(productId, sellerId, updateData);

    if (!current) {
      return null;
    }

    await this.publishProductEvent('product.updated', 'ProductUpdated', updated!, current);

    // Check for low stock warning
    const newQuantity = updated!.quantity;
    const oldQuantity = current.quantity;
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');

    if (newQuantity < threshold && oldQuantity >= threshold) {
      await this.publishLowStockEvent(updated!);
    }

    return this.formatProduct(updated!);
  }

  /**
   * Soft delete a product
   */
  async deleteProduct(sellerId: string, productId: number): Promise<{ deleted_id: number } | null> {
    const deletedProduct = await productRepository.deleteByIdAndSeller(productId, sellerId);

    if (!deletedProduct) {
      return null;
    }

    await this.publishProductEvent('product.deleted', 'ProductDeleted', deletedProduct);

    return { deleted_id: productId };
  }

  /**
   * Publish product lifecycle events to Kafka
   */
  private async publishProductEvent(topic: string, eventType: string, product: Product, previousProduct?: Product): Promise<void> {
    const event = {
      eventId: `${product.seller_id}-${product.id}-${eventType}-${Date.now()}`,
      eventType,
      timestamp: Date.now(),
      data: {
        productId: product.id,
        sellerId: product.seller_id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price.toString()),
        quantity: product.quantity,
        category: product.category,
        createdAt: product.created_at.toISOString(),
        updatedAt: product.updated_at.toISOString(),
        ...(previousProduct && { previousData: this.formatProduct(previousProduct) })
      }
    };

    try {
      await publishEvent(topic, event);
      console.log(`📤 Published ${eventType} event for product ${product.id}`);
    } catch (error) {
      console.error(`❌ Failed to publish ${eventType} event:`, error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Publish low stock warning event
   */
  private async publishLowStockEvent(product: Product): Promise<void> {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
    const event = {
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
      await publishEvent('product.lowstock', event);
      console.log(`⚠️ Published low stock warning for product ${product.id}`);
    } catch (error) {
      console.error('❌ Failed to publish low stock event:', error);
    }
  }

  /**
   * Format product data for API responses
   */
  private formatProduct(product: Product): Product {
    return {
      id: product.id,
      seller_id: product.seller_id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      quantity: product.quantity,
      category: product.category,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }
}

export default new ProductService();
