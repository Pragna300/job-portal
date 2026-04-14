require('dotenv').config();
const pool = require('./config/db');

async function fix() {
  try {
    await pool.query(`
      ALTER TABLE interview_links
      ADD COLUMN application_id INT REFERENCES applications(id);
    `);
    console.log("Successfully added application_id to interview_links!");
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log("Column application_id already exists.");
    } else {
      console.error("Error adding column:", err.message);
    }
  }
  process.exit();
}
fix();
