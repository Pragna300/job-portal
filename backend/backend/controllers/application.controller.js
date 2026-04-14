const Application = require('../models/application.model');
const pool = require('../config/db');
const Job = require('../models/job.model');
const Company = require('../models/company.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const InterviewLink = require('../models/interviewLink.model');
const { sendInterviewSetupNotification } = require('../services/notificationService');
const { extractResumeText } = require('../utils/resumeParser');
const { extractResumeEntities } = require('../services/hfResumeExtractor');
const { scoreResumeEntities } = require('../services/atsScoring');
const { sendAssessmentNotification, sendInterviewShortlistNotification, createAtsStatusNotification } = require('../services/notificationService');

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

    const user = await User.findById(application.user_id);

    // If manager marks as interview from Applicants Management, send secure unique link.
    if (status === 'interview') {
      try {
        console.log(`Setting up interview for user ID: ${application.user_id}`);
        const linkRow = await InterviewLink.createForUser(application.user_id, application.id);
        const frontendUrl = process.env.INTERVIEW_FRONTEND_URL || "http://localhost:5174";
        const interviewLink = `${frontendUrl}/interview/${linkRow.token}`;

        const companyName = company?.name || 'our company';
        
        try {
          await sendInterviewSetupNotification(
            user.id,
            user.email,
            user.name,
            interviewLink,
            job.title,
            companyName,
            company?.manager_id || req.user.id
          );
        } catch (emailErr) {
          console.error("Email notification failed for interview:", emailErr.message);
        }

        return res.json({
          message: 'Application status updated. Interview link generated and sent.',
          status: 'interview'
        });
      } catch (linkErr) {
        console.error("ERROR: Failed to create interview link for user:", application.user_id, linkErr.message);
        return res.status(500).json({ message: 'Failed to generate interview link. Please ensure the interview_links table exists.' });
      }
    }

    // NEW: Action for 'hired' status
    if (status === 'hired') {
      const subject = `Congratulations! You are Hired for ${job.title}`;
      const text = `Dear ${user.name},\n\nWe are pleased to inform you that you have been hired for the position of ${job.title} at ${company.name}. We will contact you soon with the next steps regarding your onboarding.\n\nBest regards,\n${company.name} Team`;
      await sendEmail(user.email, subject, text);
      return res.json({ message: 'Candidate hired and notification email sent successfully' });
    }

    // Existing behavior for other statuses stays unchanged.
    const subject = `Application Status Update for ${job.title}`;
    const text = `Your application status has been updated to: ${status}`;
    await sendEmail(user.email, subject, text);

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

// ── INTERNAL (called by AI-Backend after interview submit) ─────────────────
const markTestCompleted = async (req, res) => {
  try {
    const internalKey = process.env.INTERNAL_API_KEY || "";
    if (req.headers["x-internal-key"] !== internalKey) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { application_id, user_id, test_score } = req.body;
    if (!application_id && !user_id) {
      return res.status(400).json({ message: "application_id or user_id is required" });
    }

    let appId = application_id;

    // Resolve application_id from user_id if not provided directly
    if (!appId && user_id) {
      const { rows } = await pool.query(
        "SELECT id FROM applications WHERE user_id = $1 ORDER BY applied_at DESC LIMIT 1",
        [user_id]
      );
      if (!rows.length) return res.status(404).json({ message: "Application not found" });
      appId = rows[0].id;
    }

    await pool.query(
      `UPDATE applications SET status = 'test_completed', test_score = $1 WHERE id = $2`,
      [test_score || 0, appId]
    );

    console.log(`Application ${appId} marked as test_completed with score ${test_score}.`);
    return res.json({ message: "Application marked as test_completed", application_id: appId });
  } catch (error) {
    console.error("markTestCompleted error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── HARD DELETE (manager removes a rejected candidate entirely) ────────────
const hardDeleteApplication = async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (Number.isNaN(appId)) return res.status(400).json({ message: "Invalid application id" });

    const application = await Application.findById(appId);
    if (!application) return res.status(404).json({ message: "Application not found" });

    // Verify the manager owns this application's job
    const job = await Job.findById(application.job_id);
    const company = await Company.findByManagerId(req.user.id);
    if (!company || job.company_id !== company.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findById(application.user_id);

    // Clean up all related records
    try {
      // Clear out proctoring logs & sessions referencing this user/application First (to prevent FK constraint trigger failures)
      await pool.query("DELETE FROM violations_log WHERE proctoring_session_id IN (SELECT id FROM proctoring_sessions WHERE candidate_id = $1)", [application.user_id]);
      await pool.query("DELETE FROM proctoring_sessions WHERE candidate_id = $1", [application.user_id]);
    } catch (cleanErr) {
      console.warn("Could not cleanly cascade proctoring sessions (they may not exist):", cleanErr.message);
    }
    await pool.query("DELETE FROM interview_results WHERE user_id = $1", [application.user_id]);
    await pool.query("DELETE FROM interview_links   WHERE user_id = $1", [application.user_id]);
    try {
      await pool.query("DELETE FROM notifications WHERE user_id = $1", [application.user_id]);
    } catch (_) { /* notifications table may not exist */ }
    await pool.query("DELETE FROM applications WHERE id = $1", [appId]);

    // Send rejection email
    try {
      const subject = `Application Update — ${job.title}`;
      const text = `Dear ${user?.name || "Candidate"},\n\nThank you for going through the interview process for ${job.title} at ${company.name}. After careful consideration, we will not be moving forward at this time.\n\nWe appreciate your time and wish you the best.\n\n${company.name} Team`;
      await sendEmail(user.email, subject, text);
    } catch (_) { /* email failure is non-fatal */ }

    return res.json({ message: "Candidate deleted and notified", application_id: appId });
  } catch (error) {
    console.error("hardDeleteApplication error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { 
  applyForJob, 
  getMyApplications, 
  getApplicationsForJob, 
  updateApplicationStatus,
  updateTestScore,
  managerApproveForInterview,
  markTestCompleted,
  hardDeleteApplication,
};