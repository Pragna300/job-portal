const pool = require('../config/db');

class Company {
  static async create(companyData) {
    const { name, email, manager_id } = companyData;
    const { rows } = await pool.query(
      'INSERT INTO companies (name, email, manager_id) VALUES ($1, $2, $3) RETURNING id',
      [name, email, manager_id]
    );
    return rows[0].id;
  }

  static async findByManagerId(managerId) {
    const { rows } = await pool.query('SELECT * FROM companies WHERE manager_id = $1', [managerId]);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    return rows[0];
  }

  static async findAll() {
    const { rows } = await pool.query(`
      SELECT c.*, COUNT(j.id)::int AS job_count
      FROM companies c
      LEFT JOIN jobs j ON j.company_id = c.id AND j.status = 'open' AND j.is_taken_down = false
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    return rows;
  }

  static async updateProfile(id, profileData) {
    const { name, logo_url, banner_url, about, industry, location, website } = profileData;
    await pool.query(
      'UPDATE companies SET name = $1, logo_url = $2, banner_url = $3, about = $4, industry = $5, location = $6, website = $7 WHERE id = $8',
      [name, logo_url, banner_url, about, industry, location, website, id]
    );
  }

  static async approve(id) {
    await pool.query('UPDATE companies SET approved = true WHERE id = $1', [id]);
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE companies SET status = $1 WHERE id = $2', [status, id]);
  }
}

module.exports = Company;
