import { Pool, PoolClient } from 'pg';

// Global pool instance
let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 * Uses connection pooling for efficient database connections
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      // Pool configuration for optimal performance
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // TUNING:
    // - Pool size: 20-50 connections for production (20 for small apps, 50 for high traffic)
    // - idleTimeoutMillis: 30000-60000ms (30-60 seconds) to balance memory vs connection reuse
    // - connectionTimeoutMillis: 2000-5000ms (2-5 seconds) for connection acquisition
    // - Consider connection pooling per tenant for better isolation
    // - Monitor pool utilization with pg_stat_activity and adjust accordingly

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      if (pool) {
        await pool.end();
      }
    });

    process.on('SIGTERM', async () => {
      if (pool) {
        await pool.end();
      }
    });
  }

  return pool;
}

/**
 * Execute a query with automatic connection management
 * 
 * @param query - SQL query string
 * @param params - Query parameters
 * @returns Promise with query results
 */
export async function query<T = any>(
  query: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  
  try {
    const result = await pool.query(query, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query within a transaction
 * 
 * @param callback - Function that receives a client and returns a result
 * @returns Promise with the result
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a client from the pool for manual connection management
 * Remember to release the client when done!
 * 
 * @returns Promise with PoolClient
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * Close the connection pool
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Health check for the database connection
 * 
 * @returns Promise<boolean> - true if connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows.length > 0 && result.rows[0].health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
