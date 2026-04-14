require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function test() {
  try {
    console.log("Testing getUsers...");
    const { rows: users } = await pool.query(`
      SELECT u.id, u.name, u.email, u.title, u.bio, u.skills, u.status, u.created_at,
             COUNT(a.id)::int AS apps_count
      FROM users u
      LEFT JOIN applications a ON a.user_id = u.id
      WHERE u.role = 'client'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    console.log(`Found ${users.length} clients.`);

    console.log("Testing getCompanies...");
    const { rows: companies } = await pool.query(`
      SELECT c.id, c.name, c.email, c.industry, c.location, c.status, c.created_at,
             u.name AS manager_name,
             COUNT(j.id)::int AS jobs_count
      FROM companies c
      LEFT JOIN users u ON c.manager_id = u.id
      LEFT JOIN jobs j ON j.company_id = c.id
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `);
    console.log(`Found ${companies.length} companies.`);

    console.log("Testing getStats...");
    const { rows: appRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM applications"
    );
    console.log(`Applications count: ${appRows[0].count}`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
test();
