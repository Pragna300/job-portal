require('dotenv').config();
const pool = require('./config/db');

async function checkTables() {
    try {
        const { rows } = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found in database:', rows.map(r => r.table_name).join(', '));
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
}

checkTables();
