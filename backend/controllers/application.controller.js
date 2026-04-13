const Application = require('../models/application.model');
const Job = require('../models/job.model');
const Company = require('../models/company.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const { extractResumeText } = require('../utils/resumeParser');
const { extractResumeEntities } = require('../services/hfResumeExtractor');
const { scoreResumeEntities } = require('../services/atsScoring');
const {
  sendAssessmentNotification,
  sendInterviewShortlistNotification,
  createAtsStatusNotification,
  sendNotShortlistedNotification,
  sendInterviewSetupNotification,
  sendHiredNotification
} = require('../services/notificationService');
const pool = require('../config/db');
const crypto = require('crypto');

const buildInterviewLink = (token) => {
  const base = process.env.INTERVIEW_FRONTEND_URL || 'http://localhost:5174';
  return `${base.replace(/\/$/, '')}/?token=${token}`;
};

const applyForJob = async (req, res) => {
  try {
    const { job_id, cover_letter, college_name, cgpa, willing_to_relocate, experience_years } = req.body;
    const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);

    // ✅ Ensure resume is uploaded
    if (!uploadedFile) {
      return res.status(400).json({ message: "Resume is required" });
    }

    console.log("Uploaded File:", uploadedFile);

    // Use the uploaded Cloudinary URL
    const resume_url = uploadedFile.secure_url || uploadedFile.path || uploadedFile.url;
    if (!resume_url) {
      return res.status(400).json({ message: 'Resume upload failed' });
    }

    // Check if already applied
    const existingApplication = await Application.findByUserAndJob(req.user.id, job_id);
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Retrieve job description for ATS mapping
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // STEP 1: Extract resume text from PDF
    let resumeText = '';
    try {
      resumeText = await extractResumeText(resume_url);
    } catch (error) {
      console.error('Resume text extraction failed:', error.message);
      return res.status(400).json({ message: 'Unable to extract text from resume PDF' });
    }

    // STEP 2: Parse entities using HuggingFace NER model
    let parsedEntities = {
      name: '',
      email: '',
      skills: [],
      education: [],
      experience: []
    };
    try {
      parsedEntities = await extractResumeEntities(resumeText);
    } catch (hfError) {
      console.error('HuggingFace parsing failed:', hfError.message);
      parsedEntities = {
        name: '',
        email: '',
        skills: [],
        education: [],
        experience: []
      };
    }

    // STEP 3: ATS scoring using HuggingFace parsed entities against job data
    const atsScore = scoreResumeEntities(parsedEntities, resumeText, job.description, job.title);
    
    console.log("\n==================================");
    console.log(`🏆 ATS EVALUATION SCORE: ${atsScore}/100`);
    console.log("==================================\n");

    const shortlistThreshold = parseInt(process.env.ATS_SHORTLIST_THRESHOLD || '70', 10);
    const isShortlisted = atsScore >= shortlistThreshold;
    let status = 'rejected';
    let testStatus = 'not_started';

    // STEP 3: Shortlisting logic
    if (isShortlisted) {
      status = 'shortlisted';
      testStatus = 'sent';
    }

    const applicationId = await Application.create({
      job_id,
      user_id: req.user.id,
      cover_letter,
      resume_url, // ✅ fixed URL
      college_name,
      cgpa: cgpa ? parseFloat(cgpa) : null,
      willing_to_relocate: willing_to_relocate === 'true' || willing_to_relocate === true,
      experience_years: experience_years ? parseInt(experience_years) : 0,
      ats_score: atsScore,
      status: status,
      test_status: testStatus
    });

    const user = await User.findById(req.user.id);
    
    // STEP 5: ATS status notification creation
    try {
      await createAtsStatusNotification(req.user.id, status);
    } catch (notifyError) {
      console.error('ATS status notification failed:', notifyError.message);
    }

    if (isShortlisted) {
      try {
        const company = await Company.findById(job.company_id);
        await sendAssessmentNotification(req.user.id, user.email, user.name, job.title, company?.manager_id, company?.name);
      } catch (notifyError) {
        console.error('Assessment notification failed:', notifyError.message);
      }
    } else {
      try {
        const company = await Company.findById(job.company_id);
        await sendNotShortlistedNotification(req.user.id, user.email, user.name, job.title, company?.name);
      } catch (notifyError) {
        console.error('Not shortlisted notification failed:', notifyError.message);
      }
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId,
      ats_score: atsScore,
      status,
      parsed_entities: parsedEntities,
      shortlist_status: status,
      candidate_name: user.name,
      job_role: job.title
    });

  } catch (error) {
    console.error("Apply Job Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.findByUserId(req.user.id);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getApplicationsForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const company = await Company.findByManagerId(req.user.id);
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const applications = await Application.findByJobId(req.params.id);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.job_id);
    const company = await Company.findByManagerId(req.user.id);
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Application.updateStatus(req.params.id, status);

    // Send email notification
    const user = await User.findById(application.user_id);
    const companyOwnedByManager = await Company.findByManagerId(req.user.id);

    if (status === 'shortlisted') {
      await sendAssessmentNotification(
        user.id,
        user.email,
        user.name,
        job.title,
        companyOwnedByManager?.manager_id,
        companyOwnedByManager?.name
      );
    } else if (status === 'rejected') {
      await sendNotShortlistedNotification(
        user.id,
        user.email,
        user.name,
        job.title,
        companyOwnedByManager?.name
      );
    } else if (status === 'interview') {
      const token = crypto.randomUUID();
      const interviewLink = buildInterviewLink(token);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await pool.query(
        `INSERT INTO interview_links (token, user_id, application_id, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [token, application.user_id, application.id, expiresAt]
      );

      await pool.query(
        `UPDATE applications
         SET interview_status = 'Scheduled', interview_link = $1, interview_notified = true
         WHERE id = $2`,
        [interviewLink, req.params.id]
      );

      await sendInterviewSetupNotification(
        user.id,
        user.email,
        user.name,
        interviewLink,
        job.title,
        companyOwnedByManager?.name,
        companyOwnedByManager?.manager_id
      );
    } else if (status === 'hired') {
      await sendHiredNotification(
        user.id,
        user.email,
        user.name,
        job.title,
        companyOwnedByManager?.name
      );
    } else {
      const subject = `Application Status Update for ${job.title}`;
      const text = `Your application status has been updated to: ${status}`;
      await sendEmail(user.email, subject, text);
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateTestScore = async (req, res) => {
  try {
    const { application_id, test_score } = req.body;
    
    if (!application_id || test_score === undefined) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const application = await Application.findById(application_id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await Application.updateTestScore(application_id, test_score);
    
    const user = await User.findById(application.user_id);
    const job = await Job.findById(application.job_id);

    res.json({
      candidate_name: user?.name,
      job_role: job?.title,
      ats_score: application.ats_score,
      test_score: test_score,
      status: 'test_completed'
    });
  } catch (error) {
    console.error("Update Test Score Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const managerApproveForInterview = async (req, res) => {
  try {
    const application_id = req.params.id || req.body.application_id;
    
    const application = await Application.findById(application_id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.job_id);
    const company = await Company.findByManagerId(req.user.id);
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Application.updateStatus(application_id, 'interview_ready');

    const user = await User.findById(application.user_id);
    await sendInterviewShortlistNotification(user.id, user.email);

    res.json({
      candidate_name: user.name,
      job_role: job.title,
      ats_score: application.ats_score,
      test_score: application.test_score,
      status: 'interview_ready',
      message: 'Candidate approved for interview successfully'
    });
  } catch (error) {
    console.error("Manager Approve Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  applyForJob, 
  getMyApplications, 
  getApplicationsForJob, 
  updateApplicationStatus,
  updateTestScore,
  managerApproveForInterview
};