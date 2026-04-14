const Company = require('../models/company.model');
const Job = require('../models/job.model');
const Application = require('../models/application.model');
const User = require('../models/user.model');
const pool = require('../config/db');
const { sendInterviewSetupNotification, sendPostAssessmentRejectionNotification } = require('../services/notificationService');

const getProfile = async (req, res) => {
  try {
    const company = await Company.findByManagerId(req.user.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const company = await Company.findByManagerId(req.user.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const updateData = req.body;
    if (req.file) {
      updateData.logo_url = req.file.path;
    }

    await Company.updateProfile(company.id, updateData);
    res.json({ message: 'Company profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const company = await Company.findByManagerId(req.user.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const jobs = await Job.findByCompanyId(company.id);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const company = await Company.findByManagerId(req.user.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const jobs = await Job.findByCompanyId(company.id);
    const allApplications = await Application.findByCompanyId(company.id);

    const totalJobs = jobs.length;
    const totalApplications = allApplications.length;
    const shortlisted = allApplications.filter(a => a.status === 'shortlisted').length;
    const hired = allApplications.filter(a => a.status === 'hired').length;
    const pendingReviews = allApplications.filter(a => a.status === 'applied').length;

    const recentApplications = allApplications.slice(0, 5).map(app => ({
      id: app.id,
      name: app.name,
      email: app.email,
      job_title: app.job_title,
      status: app.status,
      applied_at: app.applied_at,
    }));

    res.json({
      company,
      totalJobs,
      totalApplications,
      shortlisted,
      hired,
      pendingReviews,
      recentApplications,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const scheduleInterview = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.job_id);
    const company = await Company.findByManagerId(req.user.id);
    
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const interviewLink = `https://interview.shnoor-temp-link.com/session/${application.user_id}`;

    // Update DB explicitly
    await pool.query(
      `UPDATE applications 
       SET status = 'interview', interview_status = 'Scheduled', interview_link = $1, interview_notified = true 
       WHERE id = $2`,
      [interviewLink, applicationId]
    );

    const user = await User.findById(application.user_id);
    
    await sendInterviewSetupNotification(user.id, user.email, user.name, interviewLink, job.title, company.name, company.manager_id);

    res.json({ message: 'Interview scheduled successfully', interview_link: interviewLink, status: 'interview' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const rejectCandidate = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.job_id);
    const company = await Company.findByManagerId(req.user.id);
    
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await pool.query(
      `UPDATE applications SET status = 'rejected' WHERE id = $1`,
      [applicationId]
    );

    const user = await User.findById(application.user_id);
    
    await sendPostAssessmentRejectionNotification(user.id, user.email, user.name, job.title, company.name, company.manager_id);

    res.json({ message: 'Candidate rejected successfully', status: 'rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, getMyJobs, getDashboardStats, scheduleInterview, rejectCandidate };
