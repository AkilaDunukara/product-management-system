import express from 'express';
import multer from 'multer';
import productService from '../services/productService';
import csvImportService from '../services/csvImportService';
import { productCreateSchema, productUpdateSchema, productQuerySchema } from '../validation/productSchemas';

/**
 * Product Routes - Complete REST API implementation
 * Handles CRUD operations, CSV import/export, and product management
 */

const router = express.Router();

// Multer configuration for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed') as any, false);
    }
  }
});

// POST /products - Create a new product
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = productCreateSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const product = await productService.createProduct(req.sellerId, value);
    
    console.log(`✅ Created product ${product.id} for seller ${req.sellerId}`);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// GET /products - Get products with filtering and pagination
router.get('/', async (req, res, next) => {
  try {
    const { error, value } = productQuerySchema.validate(req.query);
    if (error) {
      return next(error);
    }

    const result = await productService.getProducts(req.sellerId, value);
    
    console.log(`📋 Retrieved ${result.data.length} products for seller ${req.sellerId}`);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /products/:id - Get a single product by ID
router.get('/:id', async (req, res, next): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID. Must be a number.',
        error_code: 'INVALID_PRODUCT_ID'
      });
      return;
    }

    const product = await productService.getProductById(req.sellerId, productId);
    if (!product) {
      res.status(404).json({
        error: 'Not Found',
        message: `Product with ID ${productId} not found or does not belong to seller`,
        error_code: 'PRODUCT_NOT_FOUND'
      });
      return;
    }

    console.log(`🔍 Retrieved product ${productId} for seller ${req.sellerId}`);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /products/:id - Update a product
router.put('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID. Must be a number.',
        error_code: 'INVALID_PRODUCT_ID'
      });
      return;
    }

    const { error, value } = productUpdateSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const product = await productService.updateProduct(req.sellerId, productId, value);
    if (!product) {
      res.status(404).json({
        error: 'Not Found',
        message: `Product with ID ${productId} not found or does not belong to seller`,
        error_code: 'PRODUCT_NOT_FOUND'
      });
      return;
    }

    console.log(`✏️ Updated product ${productId} for seller ${req.sellerId}`);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /products/:id - Soft delete a product
router.delete('/:id', async (req, res, next): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID. Must be a number.',
        error_code: 'INVALID_PRODUCT_ID'
      });
      return;
    }

    const result = await productService.deleteProduct(req.sellerId, productId);
    if (!result) {
      res.status(404).json({
        error: 'Not Found',
        message: `Product with ID ${productId} not found or does not belong to seller`,
        error_code: 'PRODUCT_NOT_FOUND'
      });
      return;
    }

    console.log(`🗑️ Deleted product ${productId} for seller ${req.sellerId}`);
    res.json({
      message: 'Product deleted successfully',
      deleted_id: productId
    });
  } catch (error) {
    next(error);
  }
});

// POST /products/import - Import products from CSV file
router.post('/import', upload.single('file'), async (req, res, next): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'CSV file is required',
        error_code: 'MISSING_FILE'
      });
      return;
    }

    console.log(`📤 Starting CSV import for seller ${req.sellerId}, file size: ${req.file.size} bytes`);

    const importPromise = csvImportService.processImport(req.sellerId, req.file.buffer);
    
    const importId = `import-${req.sellerId}-${Date.now()}`;
    res.status(202).json({
      message: 'Import accepted and processing',
      import_id: importId,
      status: 'processing'
    });

    importPromise
      .then(results => {
        console.log(`✅ Import ${importId} completed:`, {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errorCount: results.errors.length
        });
      })
      .catch(error => {
        console.error(`❌ Import ${importId} failed:`, error);
      });

  } catch (error) {
    next(error);
  }
});

export default router;
