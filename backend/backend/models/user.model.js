const pool = require('../config/db');

class User {
  static async create(userData) {
    const { name, email, password, role } = userData;
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, password, role]
    );
    return rows[0].id;
  }

  static async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, profile_pic, resume_url, skills, bio, title, custom_url, status, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  static async updateProfile(id, profileData) {
    const { name, profile_pic, resume_url, skills, bio, title, custom_url } = profileData;
    await pool.query(
      'UPDATE users SET name = $1, profile_pic = $2, resume_url = $3, skills = $4, bio = $5, title = $6, custom_url = $7 WHERE id = $8',
      [name, profile_pic, resume_url, skills, bio, title, custom_url, id]
    );
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
  }

  static async findAllClients() {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.title, u.bio, u.skills, u.status, u.created_at,
             COUNT(a.id)::int AS apps_count
      FROM users u
      LEFT JOIN applications a ON a.user_id = u.id
      WHERE u.role = 'client'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return rows;
  }

  static async updatePassword(email, newPassword) {
    const { rowCount } = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [newPassword, email]
    );
    return rowCount > 0;
  }
}

module.exports = User;
