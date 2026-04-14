require('dotenv').config();
const pool = require('./config/db');

const query = `
DROP TABLE IF EXISTS warnings_log CASCADE;
DROP TABLE IF EXISTS violations_log CASCADE;
DROP TABLE IF EXISTS proctoring_sessions CASCADE;

CREATE TABLE proctoring_sessions (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    integrity_score INTEGER DEFAULT 100,
    violation_count INTEGER DEFAULT 0,
    warnings_sent INTEGER DEFAULT 0,
    termination_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP
);

CREATE TABLE violations_log (
    id SERIAL PRIMARY KEY,
    proctoring_session_id INTEGER REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
    violation_type VARCHAR(100),
    integrity_reduction INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warnings_log (
    id SERIAL PRIMARY KEY,
    proctoring_session_id INTEGER REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
    warning_number INTEGER,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

pool.query(query).then(() => {
    console.log('Proctoring schema successfully recreated!');
    process.exit(0);
}).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
