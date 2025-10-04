import { getPool } from '../config/database';
import { Product, ProductCreateData, ProductUpdateData, ProductFilters } from '../types';

/**
 * Product Repository - Database access layer for product operations
 * Handles all PostgreSQL queries with proper transaction management
 */

class ProductRepository {
  
  /**
   * Create a new product with transaction safety
   */
  async create(sellerId: string, productData: ProductCreateData): Promise<Product> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Start transaction for data consistency
      await client.query('BEGIN');

      const query = `
        INSERT INTO products (seller_id, name, description, price, quantity, category)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        sellerId,
        productData.name,
        productData.description || null,
        productData.price,
        productData.quantity,
        productData.category
      ];

      const result = await client.query(query, values);
      const product = result.rows[0];

      // Commit transaction on success
      await client.query('COMMIT');
      return product;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find products by seller with filtering, sorting, and pagination
   */
  async findBySeller(sellerId: string, filters: ProductFilters = {}): Promise<Product[]> {
    const pool = getPool();
    
    let query = `
      SELECT * FROM products 
      WHERE seller_id = $1 AND deleted_at IS NULL
    `;
    
    const values: any[] = [sellerId];
    let paramCount = 1;

    // Build dynamic WHERE clauses based on filters

    if (filters.category) {
      query += ` AND category = $${++paramCount}`;
      values.push(filters.category);
    }

    if (filters.min_quantity !== undefined) {
      query += ` AND quantity >= $${++paramCount}`;
      values.push(filters.min_quantity);
    }

    if (filters.max_quantity !== undefined) {
      query += ` AND quantity <= $${++paramCount}`;
      values.push(filters.max_quantity);
    }

    // Add sorting with validation
    const sortColumn = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // Add pagination
    const limit = filters.limit || 20;
    const offset = ((filters.page || 1) - 1) * limit;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Count products by seller with same filters (for pagination)
   */
  async countBySeller(sellerId: string, filters: ProductFilters = {}): Promise<number> {
    const pool = getPool();
    
    let countQuery = `
      SELECT COUNT(*) FROM products 
      WHERE seller_id = $1 AND deleted_at IS NULL
    `;
    const countValues: any[] = [sellerId];
    let countParamCount = 1;

    if (filters.category) {
      countQuery += ` AND category = $${++countParamCount}`;
      countValues.push(filters.category);
    }

    if (filters.min_quantity !== undefined) {
      countQuery += ` AND quantity >= $${++countParamCount}`;
      countValues.push(filters.min_quantity);
    }

    if (filters.max_quantity !== undefined) {
      countQuery += ` AND quantity <= $${++countParamCount}`;
      countValues.push(filters.max_quantity);
    }

    const result = await pool.query(countQuery, countValues);
    return parseInt(result.rows[0].count);
  }

  /**
   * Find a single product by ID and seller (for authorization)
   */
  async findByIdAndSeller(productId: number, sellerId: string): Promise<Product | null> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM products 
      WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [productId, sellerId]);
    return result.rows[0] || null;
  }

  /**
   * Update product with transaction safety and return both current and updated versions
   */
  async updateByIdAndSeller(productId: number, sellerId: string, updateData: ProductUpdateData): Promise<{ current: Product | null; updated: Product | null }> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Get current product for comparison
      const currentResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL',
        [productId, sellerId]
      );

      if (currentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { current: null, updated: null };
      }

      const currentProduct = currentResult.rows[0];

      // Build dynamic UPDATE query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${++paramCount}`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        await client.query('ROLLBACK');
        return { current: currentProduct, updated: currentProduct };
      }

      // Execute update
      values.push(productId, sellerId);
      const query = `
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE id = $${++paramCount} AND seller_id = $${++paramCount} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      const updatedProduct = result.rows[0];

      await client.query('COMMIT');
      return { current: currentProduct, updated: updatedProduct };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete a product (sets deleted_at timestamp)
   */
  async deleteByIdAndSeller(productId: number, sellerId: string): Promise<Product | null> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const query = `
        UPDATE products 
        SET deleted_at = NOW()
        WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [productId, sellerId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const deletedProduct = result.rows[0];
      await client.query('COMMIT');
      return deletedProduct;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Batch insert multiple products efficiently
   */
  async batchInsert(sellerId: string, products: ProductCreateData[]): Promise<Product[]> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Start transaction for batch operation
      await client.query('BEGIN');

      // Build batch insert query with placeholders
      const values: any[] = [];
      const placeholders: string[] = [];
      
      products.forEach((product, index) => {
        const baseIndex = index * 6;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`);
        values.push(
          sellerId,
          product.name,
          product.description,
          product.price,
          product.quantity,
          product.category
        );
      });

      const query = `
        INSERT INTO products (seller_id, name, description, price, quantity, category)
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const result = await client.query(query, values);
      const insertedProducts = result.rows;

      await client.query('COMMIT');
      return insertedProducts;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findLowStockProducts(sellerId: string, threshold: number): Promise<Product[]> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM products 
      WHERE seller_id = $1 AND quantity < $2 AND deleted_at IS NULL
      ORDER BY quantity ASC
    `;

    const result = await pool.query(query, [sellerId, threshold]);
    return result.rows;
  }

  async getSellerStats(sellerId: string): Promise<{
    total_products: number;
    total_quantity: number;
    average_price: number;
    low_stock_count: number;
  }> {
    const pool = getPool();
    
    const query = `
      SELECT 
        COUNT(*) as total_products,
        SUM(quantity) as total_quantity,
        AVG(price) as average_price,
        COUNT(CASE WHEN quantity < $2 THEN 1 END) as low_stock_count
      FROM products 
      WHERE seller_id = $1 AND deleted_at IS NULL
    `;

    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
    const result = await pool.query(query, [sellerId, threshold]);
    
    const stats = result.rows[0];
    return {
      total_products: parseInt(stats.total_products),
      total_quantity: parseInt(stats.total_quantity) || 0,
      average_price: parseFloat(stats.average_price) || 0,
      low_stock_count: parseInt(stats.low_stock_count)
    };
  }
}

export default new ProductRepository();
