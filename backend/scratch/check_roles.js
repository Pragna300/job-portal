const pool = require('./config/db');
async function checkRoles() {
  try {
    const res = await pool.query('SELECT id, name, email, role FROM users LIMIT 10');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkRoles();
