const { Pool } = require('pg');

let pool;

const initializeDatabase = async () => {
  pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test connection
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

module.exports = {
  initializeDatabase,
  getPool
};