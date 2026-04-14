require('dotenv').config();
const pool = require('./config/db');
const { updateApplicationStatus } = require('./controllers/application.controller');

async function test() {
  const { rows } = await pool.query('SELECT a.id, a.user_id, j.company_id, c.manager_id FROM applications a JOIN jobs j ON a.job_id = j.id JOIN companies c ON j.company_id = c.id LIMIT 1;');
  if (rows.length === 0) { console.log("No apps"); process.exit(); }
  const app = rows[0];

  const req = {
    body: { status: 'interview' },
    params: { id: app.id },
    user: { id: app.manager_id }
  };
  const res = {
    json: (data) => console.log("RES.JSON:", data),
    status: (code) => ({
      json: (data) => {
        console.log(`RES.STATUS(${code}):`, data);
        if(code === 500) console.log("Real error message:", data.error);
      }
    })
  };
  await updateApplicationStatus(req, res);
  process.exit();
}
test();
