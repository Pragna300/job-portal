require('dotenv').config();
const pool = require('./config/db');

async function test() {
  try {
    const res = await pool.query('SELECT * FROM interview_links LIMIT 1;');
    console.log("interview_links exists");
  } catch (err) {
    console.log("error interview_links", err.message);
  }
  
  try {
    const res = await pool.query('SELECT interview_status, interview_link FROM applications LIMIT 1;');
    console.log("applications has interview columns");
  } catch(err) {
    console.log("error applications", err.message);
  }
  process.exit();
}
test();
