const express = require('express');
const multer = require('multer');
const productService = require('../services/productService');
const csvImportService = require('../services/csvImportService');
const { productCreateSchema, productUpdateSchema, productQuerySchema } = require('../validation/productSchemas');

const router = express.Router();

// Configure multer for CSV upload with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

/**
 * POST /products - Create a new product
 */
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

/**
 * GET /products - List products with filtering and pagination
 */
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

/**
 * GET /products/:id - Get a specific product
 */
router.get('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID. Must be a number.',
        error_code: 'INVALID_PRODUCT_ID'
      });
    }

    const product = await productService.getProductById(req.sellerId, productId);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID ${productId} not found or does not belong to seller`,
        error_code: 'PRODUCT_NOT_FOUND'
      });
    }

    console.log(`🔍 Retrieved product ${productId} for seller ${req.sellerId}`);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /products/:id - Update a product
 */
router.put('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID. Must be a number.',
        error_code: 'INVALID_PRODUCT_ID'
      });
    }

    const { error, value } = productUpdateSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const product = await productService.updateProduct(req.sellerId, productId, value);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID ${productId} not found or does not belong to seller`,
        error_code: 'PRODUCT_NOT_FOUND'
      });
    }

    console.log(`✏️ Updated product ${productId} for seller ${req.sellerId}`);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /products/:id - Delete a product (soft delete)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID. Must be a number.',
        error_code: 'INVALID_PRODUCT_ID'
      });
    }

    const result = await productService.deleteProduct(req.sellerId, productId);
    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID ${productId} not found or does not belong to seller`,
        error_code: 'PRODUCT_NOT_FOUND'
      });
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

/**
 * POST /products/import - Bulk import products from CSV
 */
router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'CSV file is required',
        error_code: 'MISSING_FILE'
      });
    }

    console.log(`📤 Starting CSV import for seller ${req.sellerId}, file size: ${req.file.size} bytes`);

    // Start processing asynchronously
    const importPromise = csvImportService.processImport(req.sellerId, req.file.buffer);
    
    // Return immediate response (202 Accepted)
    const importId = `import-${req.sellerId}-${Date.now()}`;
    res.status(202).json({
      message: 'Import accepted and processing',
      import_id: importId,
      status: 'processing'
    });

    // Process in background and log results
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

module.exports = router;