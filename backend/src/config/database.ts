import { Pool, QueryResult } from 'pg';
import { env } from './env';

/**
 * PostgreSQL Connection Pool
 *
 * A "pool" keeps multiple database connections open and reuses them,
 * which is much faster than opening a new connection for every request.
 * - max: 20 connections at once
 * - idleTimeoutMillis: close unused connections after 30 seconds
 * - connectionTimeoutMillis: fail if can't connect within 5 seconds
 */
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log connection issues
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL pool: new client connected');
});

/**
 * Execute a parameterized SQL query.
 * Always use parameterized queries ($1, $2, etc.) to prevent SQL injection!
 *
 * @example
 * const result = await query('SELECT * FROM users WHERE email = $1', ['user@example.com']);
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (env.NODE_ENV === 'development') {
    console.log(`📊 Query executed in ${duration}ms | Rows: ${result.rowCount}`);
  }

  return result;
};

/**
 * Get a client from the pool for transactions.
 * Remember to release the client when done!
 *
 * @example
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT INTO ...');
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 *   throw e;
 * } finally {
 *   client.release();
 * }
 */
export const getClient = () => pool.connect();

/**
 * Test database connectivity — used at app startup.
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ PostgreSQL connected at ${result.rows[0].now}`);
    return true;
  } catch (error: any) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
};
