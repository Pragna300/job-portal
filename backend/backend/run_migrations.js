require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function runMigrations() {
  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running initial database schema...');
    
    // If you want to automatically uncomment the ALTER statements to run them,
    // we can parse and run them here as well.
    const migrationLines = sql.split('\n');
    let createTableSql = '';
    let alterStatements = [];

    for (let line of migrationLines) {
      if (
        line.startsWith('-- ALTER ') ||
        line.startsWith('-- CREATE TABLE ') ||
        line.startsWith('-- CREATE INDEX ') ||
        line.startsWith('-- CREATE UNIQUE INDEX ')
      ) {
        // Uncomment the migration statements
        alterStatements.push(line.replace(/^--\s*/, ''));
      } else {
        createTableSql += line + '\n';
      }
    }

    try {
      await pool.query(createTableSql);
      console.log('Main schema executed successfully.');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('Tables already exist. Skipping base schema creation.');
      } else {
        throw err;
      }
    }

    console.log('Running ALTER statements to ensure columns exist...');
    for (const alterQuery of alterStatements) {
      if (alterQuery.trim() !== '') {
        try {
          await pool.query(alterQuery);
          console.log(`Executed: ${alterQuery}`);
        } catch (err) {
          // If the column already exists, Postgres handles it via IF NOT EXISTS 
          // but if we get other errors, let's log them
          console.log(`Skipped/Error on: ${alterQuery} -> ${err.message}`);
        }
      }
    }

    console.log('Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error.message);
    process.exit(1);
  }
}

runMigrations();
