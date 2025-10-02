BEGIN;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS products CASCADE;

COMMIT;