const { Pool } = require('pg');
require('dotenv').config();

// Determine if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.FUNCTION_TARGET === 'api' || 
                    process.env.K_SERVICE === 'api' ||
                    process.env.FIREBASE_CONFIG !== undefined;

// In production, we may not need a DB connection for all routes
let pool = null;

// Only create a pool if DB credentials are available
if (process.env.DB_HOST && process.env.DB_NAME) {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });
  
  console.log('Database connection pool created');
} else {
  console.log('Database connection info missing, some features will be limited');
}

module.exports = {
  query: (text, params) => {
    if (!pool) {
      console.error('Database not configured');
      return Promise.reject(new Error('Database not configured'));
    }
    return pool.query(text, params);
  },
  pool,
  isConnected: !!pool
}; 