const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class InterviewLink {
  /**
   * Create a secure, unique token for a candidate interview.
   * Token expires in 24 hours.
   */
  static async createForUser(userId, applicationId) {
    // Retry on the extremely unlikely case of UUID collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const token = uuidv4();
      try {
        const { rows } = await pool.query(
          `INSERT INTO interview_links (token, user_id, application_id, expires_at)
           VALUES ($1, $2, $3, NOW() + INTERVAL '1 day')
           RETURNING token, user_id, application_id, is_used, expires_at, created_at`,
          [token, userId, applicationId]
        );
        return rows[0];
      } catch (err) {
        // 23505 = unique_violation (token)
        if (err && err.code === '23505' && attempt < 2) continue;
        throw err;
      }
    }
    throw new Error('Unable to generate unique interview token');
  }

  static async getLatestForUser(userId) {
    const { rows } = await pool.query(
      `SELECT *
       FROM interview_links
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async markUsed(token) {
    await pool.query(
      `UPDATE interview_links
       SET is_used = TRUE
       WHERE token = $1`,
      [token]
    );
  }

  static async findValidByToken(token) {
    const { rows } = await pool.query(
      `SELECT *
       FROM interview_links
       WHERE token = $1
         AND is_used = FALSE
         AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  }
}

module.exports = InterviewLink;

