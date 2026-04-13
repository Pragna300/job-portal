// Fix proctoring_sessions table to allow nullable FKs and remove required token column
const pool = require('../config/db');

async function migrate() {
  try {
    // Allow nullable candidate_id, application_id, and token
    await pool.query(`
      ALTER TABLE proctoring_sessions 
        ALTER COLUMN candidate_id DROP NOT NULL,
        ALTER COLUMN application_id DROP NOT NULL
    `);
    console.log('✅ Dropped NOT NULL from candidate_id, application_id');

    // Remove token NOT NULL constraint if column exists
    await pool.query(`
      ALTER TABLE proctoring_sessions ALTER COLUMN token DROP NOT NULL
    `).catch(() => console.log('ℹ️  token column already nullable or does not exist'));

    // Add DISQUALIFIED to allowed statuses
    await pool.query(`
      ALTER TABLE proctoring_sessions 
        DROP CONSTRAINT IF EXISTS proctoring_sessions_status_check
    `);
    await pool.query(`
      ALTER TABLE proctoring_sessions 
        ADD CONSTRAINT proctoring_sessions_status_check 
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'TERMINATED', 'DISQUALIFIED'))
    `);
    console.log('✅ Added DISQUALIFIED status');

    console.log('\n✅ Migration complete. Restart the backend server.');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
