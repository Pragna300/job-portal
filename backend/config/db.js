const { Pool } = require('pg');

const connectionString = (process.env.DATABASE_URL || '').trim();

const pool = connectionString
  ? new Pool({ connectionString, max: 10 })
  : new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD),  // Force string to prevent SASL auth error
      database: process.env.DB_NAME,
      max: 10
    });

// Optional: check connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('Successfully connected to PostgreSQL');
    release();
  }
});

module.exports = pool;