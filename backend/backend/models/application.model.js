const pool = require('../config/db');

class Application {
  static async create(applicationData) {
    const { job_id, user_id, cover_letter, resume_url, college_name, cgpa, willing_to_relocate, experience_years, ats_score, status, test_status } = applicationData;
    const { rows } = await pool.query(
      `INSERT INTO applications (job_id, user_id, cover_letter, resume_url, college_name, cgpa, willing_to_relocate, experience_years, ats_score, status, test_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [job_id, user_id, cover_letter, resume_url, college_name || null, cgpa || null, willing_to_relocate || false, experience_years || 0, ats_score || null, status || 'applied', test_status || 'not_started']
    );
    return rows[0].id;
  }

  static async updateTestScore(id, testScore) {
    await pool.query('UPDATE applications SET test_score = $1, test_status = $2, status = $3 WHERE id = $4', [testScore, 'completed', 'test_completed', id]);
  }

  static async findByUserAndJob(userId, jobId) {
    const { rows } = await pool.query('SELECT * FROM applications WHERE user_id = $1 AND job_id = $2', [userId, jobId]);
    return rows[0];
  }

  static async findByUserId(userId) {
    const { rows } = await pool.query(`
      SELECT a.*, j.title AS job_title, c.name AS company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.applied_at DESC
    `, [userId]);
    return rows;
  }

  static async findByJobId(jobId) {
    const { rows } = await pool.query(`
      SELECT a.*, u.name, u.email, u.profile_pic, u.resume_url AS user_resume_url,
             u.skills, u.bio, u.title AS user_title
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.job_id = $1
      ORDER BY a.applied_at DESC
    `, [jobId]);
    return rows;
  }

  static async findByCompanyId(companyId) {
    const { rows } = await pool.query(`
      SELECT a.*, u.name, u.email, u.profile_pic, u.skills, u.bio, u.title AS user_title,
             j.title AS job_title, j.location AS job_location, j.id AS job_id
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE j.company_id = $1
      ORDER BY a.applied_at DESC
    `, [companyId]);
    return rows;
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    return rows[0];
  }

  static async getDashboardStatsForUser(userId) {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS total_applied,
        COUNT(CASE WHEN status = 'interview' THEN 1 END)::int AS interviews,
        COUNT(CASE WHEN status = 'hired' THEN 1 END)::int AS hired,
        COUNT(CASE WHEN status = 'shortlisted' THEN 1 END)::int AS shortlisted
      FROM applications
      WHERE user_id = $1
    `, [userId]);
    return rows[0];
  }

  static async getRecentActivity(limit = 5) {
    const { rows } = await pool.query(`
      SELECT a.id, a.applied_at, a.status,
             u.name AS candidate_name,
             j.title AS job_title,
             c.name AS company_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY a.applied_at DESC
      LIMIT $1
    `, [limit]);
    return rows;
  }
}

module.exports = Application;
