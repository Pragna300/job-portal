const pool = require('../config/db');
const Company = require('../models/company.model');
const User = require('../models/user.model');
const Job = require('../models/job.model');
const Application = require('../models/application.model');

const getStats = async (req, res) => {
  try {
    const { rows: candidateRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE role = 'client'"
    );
    const { rows: companyRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM companies"
    );
    const { rows: jobRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM jobs WHERE status = 'open' AND is_taken_down = false"
    );
    const { rows: appRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM applications"
    );

    // Recent jobs posted (last 3)
    const { rows: recentJobs } = await pool.query(`
      SELECT j.id, j.title, j.created_at, c.name AS company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      ORDER BY j.created_at DESC
      LIMIT 3
    `);

    // Recent applications (last 3)
    const recentApps = await Application.getRecentActivity(3);

    res.json({
      candidates: candidateRows[0].count,
      companies: companyRows[0].count,
      activeJobs: jobRows[0].count,
      totalApplications: appRows[0].count,
      recentJobs,
      recentApplications: recentApps,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAllClients();
    // For each user, get their recent applications
    const usersWithApps = await Promise.all(users.map(async (user) => {
      const { rows } = await pool.query(`
        SELECT a.id, a.status, j.title AS job_title, j.id AS job_id
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.user_id = $1
        ORDER BY a.applied_at DESC
        LIMIT 5
      `, [user.id]);
      return { ...user, recent_applications: rows };
    }));
    res.json(usersWithApps);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAdminJobs = async (req, res) => {
  try {
    const jobs = await Job.findAllAdmin();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await Company.approve(id);
    res.json({ message: 'Company approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use active or suspended.' });
    }
    await User.updateStatus(id, status);
    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use active or suspended.' });
    }
    await Company.updateStatus(id, status);
    res.json({ message: `Company status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateAdminJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_taken_down } = req.body;
    await Job.updateTakenDown(id, is_taken_down);
    res.json({ message: `Job ${is_taken_down ? 'taken down' : 'restored'} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  getCompanies,
  getAdminJobs,
  approveCompany,
  updateUserStatus,
  updateCompanyStatus,
  updateAdminJobStatus,
};
