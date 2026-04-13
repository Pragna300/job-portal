require('dotenv').config();
const pool = require('../config/db');

async function migrateRoles() {
  try {
    console.log('Starting role migration: client -> user...');
    
    // 1. Update users table
    const res = await pool.query(
      "UPDATE users SET role = 'user' WHERE role = 'client' RETURNING id"
    );
    
    console.log(`Successfully migrated ${res.rowCount} users from 'client' to 'user'.`);
    
    // 2. Double check if any 'client' remains
    const check = await pool.query("SELECT count(*) FROM users WHERE role = 'client'");
    if (check.rows[0].count > 0) {
      console.warn(`Warning: ${check.rows[0].count} users still have role 'client'.`);
    } else {
      console.log('Data integrity check passed: No users with role "client" remain.');
    }

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrateRoles();
