const pool = require('../config/db');

class InterviewResult {
  static async getLatestByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT user_id, score, feedback, created_at
       FROM interview_results
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }
}

module.exports = InterviewResult;

