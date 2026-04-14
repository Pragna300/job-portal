require('dotenv').config();
const pool = require('./config/db');
pool.query("SELECT role, password, status FROM users WHERE email='snehajadhav070105@gmail.com'")
.then(res => console.log(res.rows))
.finally(() => pool.end());
