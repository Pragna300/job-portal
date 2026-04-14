const pool = require('../config/db');

class Job {
  static async create(jobData) {
    const { title, description, company_id, salary_min, salary_max, location, type } = jobData;
    const { rows } = await pool.query(
      'INSERT INTO jobs (title, description, company_id, salary_min, salary_max, location, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [title, description, company_id, salary_min, salary_max, location, type]
    );
    return rows[0].id;
  }

  static async findAll() {
    const { rows } = await pool.query(`
      SELECT j.*, c.name AS company_name, c.logo_url
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'open' AND j.is_taken_down = false
      ORDER BY j.created_at DESC
    `);
    return rows;
  }

  static async findAllAdmin() {
    const { rows } = await pool.query(`
      SELECT j.*, c.name AS company_name,
             COUNT(a.id)::int AS applicant_count
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      LEFT JOIN applications a ON a.job_id = j.id
      GROUP BY j.id, c.name
      ORDER BY j.created_at DESC
    `);
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(`
      SELECT j.*, c.name AS company_name, c.logo_url, c.about AS company_about
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [id]);
    return rows[0];
  }

  static async findByCompanyId(companyId) {
    const { rows } = await pool.query(`
      SELECT j.*,
             COUNT(a.id)::int AS applications_count,
             COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END)::int AS shortlisted_count
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.id
      WHERE j.company_id = $1
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [companyId]);
    return rows;
  }

  static async update(id, jobData) {
    const { title, description, salary_min, salary_max, location, type, status } = jobData;
    await pool.query(
      'UPDATE jobs SET title = $1, description = $2, salary_min = $3, salary_max = $4, location = $5, type = $6, status = $7 WHERE id = $8',
      [title, description, salary_min, salary_max, location, type, status, id]
    );
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', [status, id]);
  }

  static async updateTakenDown(id, isTakenDown) {
    await pool.query('UPDATE jobs SET is_taken_down = $1 WHERE id = $2', [isTakenDown, id]);
  }

  static async delete(id) {
    await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
  }
}

module.exports = Job;
