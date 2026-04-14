require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Running migration: Add interview_link to applications...');
        await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_link VARCHAR(500)');
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
