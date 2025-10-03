const productRepository = require('../repositories/productRepository');
const { publishEvent } = require('../config/kafka');

/**
 * Product service handling all product-related business logic
 * Includes CRUD operations, event publishing, and data formatting
 */
class ProductService {
  
  /**
   * Create a new product
   */
  async createProduct(sellerId, productData) {
    // Use repository for data access
    const product = await productRepository.create(sellerId, productData);

    // Publish ProductCreated event
    await this.publishProductEvent('product.created', 'ProductCreated', product);

    // Check for low stock and publish warning if needed
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
    if (product.quantity < threshold) {
      await this.publishLowStockEvent(product);
    }

    return this.formatProduct(product);
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(sellerId, filters) {
    // Use repository for data access
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
  async getProductById(sellerId, productId) {
    const product = await productRepository.findByIdAndSeller(productId, sellerId);
    
    if (!product) {
      return null;
    }

    return this.formatProduct(product);
  }

  /**
   * Update an existing product
   */
  async updateProduct(sellerId, productId, updateData) {
    // Use repository for data access
    const { current, updated } = await productRepository.updateByIdAndSeller(productId, sellerId, updateData);

    if (!current) {
      return null;
    }

    // Publish ProductUpdated event
    await this.publishProductEvent('product.updated', 'ProductUpdated', updated, current);

    // Check for low stock warning
    const newQuantity = updated.quantity;
    const oldQuantity = current.quantity;
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');

    if (newQuantity < threshold && oldQuantity >= threshold) {
      await this.publishLowStockEvent(updated);
    }

    return this.formatProduct(updated);
  }

  /**
   * Soft delete a product
   */
  async deleteProduct(sellerId, productId) {
    // Use repository for data access
    const deletedProduct = await productRepository.deleteByIdAndSeller(productId, sellerId);

    if (!deletedProduct) {
      return null;
    }

    // Publish ProductDeleted event
    await this.publishProductEvent('product.deleted', 'ProductDeleted', deletedProduct);

    return { deleted_id: productId };
  }

  /**
   * Publish product lifecycle events to Kafka
   */
  async publishProductEvent(topic, eventType, product, previousProduct = null) {
    const event = {
      eventId: `${product.seller_id}-${product.id}-${eventType}-${Date.now()}`,
      eventType,
      timestamp: Date.now(),
      data: {
        productId: product.id,
        sellerId: product.seller_id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
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
  async publishLowStockEvent(product) {
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
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Format product data for API response
   */
  formatProduct(product) {
    return {
      id: product.id,
      seller_id: product.seller_id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      quantity: product.quantity,
      category: product.category,
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString()
    };
  }
}

module.exports = new ProductService();