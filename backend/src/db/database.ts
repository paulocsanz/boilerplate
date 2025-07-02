import postgres from 'postgres';

// Create connection pool
const pool = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/boilerplate', {
  transform: {
    undefined: null,
  },
  max: 20, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  max_lifetime: 60 * 30, // Close connections after 30 minutes
});

// Application context interface
export interface AppContext {
  sql: postgres.Sql;
  transaction<T>(fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T>;
}

// Create application context
export function createAppContext(): AppContext {
  return {
    sql: pool,
    transaction: <T>(fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> => {
      return pool.begin(fn) as Promise<T>;
    }
  };
}

// For migration compatibility
export { pool as sql };

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}