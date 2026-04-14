require('dotenv').config({path: './backend/.env'});
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
pool.query('SELECT email, role FROM users LIMIT 10;', (err, res) => {
  console.log(err ? err : res.rows);
  pool.end();
});
