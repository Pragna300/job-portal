const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

const sql = `
CREATE TABLE IF NOT EXISTS proctoring_sessions (
    id SERIAL PRIMARY KEY, 
    candidate_id INT NOT NULL, 
    status VARCHAR(20) DEFAULT 'ACTIVE', 
    integrity_score INT DEFAULT 100, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    end_time TIMESTAMP, 
    termination_reason VARCHAR(255), 
    FOREIGN KEY (candidate_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS violations_log (
    id SERIAL PRIMARY KEY, 
    proctoring_session_id INT NOT NULL, 
    violation_type VARCHAR(255) NOT NULL, 
    integrity_reduction INT DEFAULT 0, 
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (proctoring_session_id) REFERENCES proctoring_sessions(id)
);

CREATE TABLE IF NOT EXISTS warnings_log (
    id SERIAL PRIMARY KEY, 
    proctoring_session_id INT NOT NULL, 
    warning_number INT NOT NULL, 
    message TEXT, 
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (proctoring_session_id) REFERENCES proctoring_sessions(id)
);
`;

async function migrate() {
  try {
    console.log("Checking and creating proctoring tables...");
    await pool.query(sql);
    console.log("✅ Proctoring tables are ready.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
