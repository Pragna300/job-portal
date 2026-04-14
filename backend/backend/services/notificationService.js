const sendEmail = require('../utils/sendEmail');
const pool = require('../config/db');

async function sendAssessmentNotification(userId, email, candidateName, jobRole, managerId, companyName) {
  // Backward compatibility: allow sendAssessmentNotification(email)
  if (typeof userId === 'string' && !email) {
    email = userId;
    userId = null;
    candidateName = 'Candidate';
    jobRole = 'applied';
  }

  // 1. Send Email
  const subject = `Coding Assessment Invitation - ${jobRole} at ${companyName || 'our company'}`;
  const text = `Dear ${candidateName},

Congratulations! You have been shortlisted for the ${jobRole} position at ${companyName || 'our company'}.

To help us evaluate your technical skills, you are invited to complete a coding assessment.

Assessment Link:
https://assessments.shnoor.com

Please carefully read and follow these prerequisites to ensure a smooth testing experience:

BEFORE THE TEST:
• Ensure you have a stable internet connection.
• Find a quiet, well-lit room free from distractions.
• Verify your webcam and microphone are working properly.

DURING THE TEST:
• Do not switch tabs or open other applications; doing so may result in disqualification.
• Keep your face clearly visible within the webcam frame at all times.
• The test must be completed in a single continuous session.

AFTER THE TEST:
• Ensure your responses are fully submitted before closing the browser.
• You will receive an update regarding your application status via email within a few days.

Best regards,
Hiring Team at ${companyName || 'our company'}`;

  await sendEmail(email, subject, text);

  // 2. Insert into notifications table for the Candidate
  if (userId) {
    const candidateMsgObj = {
      text: `You have been selected for a coding assessment for the ${jobRole} position at ${companyName || 'our company'}.`,
      link: `https://assessments.shnoor.com`,
      prerequisites: {
        before: "Ensure a stable internet connection. Find a quiet, well-lit environment. Verify webcam/mic.",
        during: "Do not switch tabs. Keep your face visible in the webcam frame at all times.",
        after: "Ensure submission is complete before closing. Await results via email."
      }
    };
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
        [userId, JSON.stringify(candidateMsgObj), 'assessment']
      );
    } catch (_) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
        [userId, JSON.stringify(candidateMsgObj), 'assessment']
      );
    }
  }

  // 3. Insert into notifications table for the Manager
  if (managerId) {
    const managerMsg = `Automated assessment link sent to ${candidateName} for the ${jobRole} position.`;
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
        [managerId, managerMsg, 'assessment_sent']
      );
    } catch (_) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
        [managerId, managerMsg, 'assessment_sent']
      );
    }
  }
}

async function sendInterviewShortlistNotification(userId, email) {
  const subject = `Interview Shortlist Status`;
  const text = `You have been shortlisted for the interview round. Interview scheduling details will be shared shortly.`;
  
  await sendEmail(email, subject, text);

  await pool.query(
    `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
    [userId, text, 'interview']
  );
}

async function sendResumeShortlistNotification(userId, email) {
  const text = "You have been shortlisted based on your resume evaluation. Please complete the coding assessment to proceed to the next stage.";

  if (email) {
    await sendEmail(email, 'Resume Shortlist Update', text);
  }

  if (userId) {
    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
      [userId, text, 'shortlist']
    );
  }
}

async function createAtsStatusNotification(userId, shortlistStatus) {
  const message = shortlistStatus === 'shortlisted'
    ? 'Congratulations! You are shortlisted for the next round.'
    : 'Thank you for applying. Your profile will be considered for future roles.';

  try {
    await pool.query(
      `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
      [userId, message, shortlistStatus]
    );
  } catch (_) {
    // Backward-compatible fallback for existing schema that uses "type" instead of "status".
    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
      [userId, message, shortlistStatus]
    );
  }
}

async function sendInterviewSetupNotification(userId, email, candidateName, interviewLink, jobTitle, companyName, managerId) {
  const subject = `Interview Scheduled - ${jobTitle} at ${companyName || 'our company'}`;
  const text = `Dear ${candidateName},

We are extremely pleased to inform you that you have been shortlisted for a live interview for the ${jobTitle} position at ${companyName || 'our company'}!

Please find your unique interview session link below:
${interviewLink}

INTERVIEW PREPARATION:
• Please click the link and log in at least 5 minutes prior to the scheduled time.
• Ensure your webcam and microphone are working properly.
• The interview will consist of a mix of behavioral questions and role-specific technical discussions.
• Find a quiet, well-lit environment free of background noise.

Your application status has been internally updated to "Interview Scheduled". We look forward to speaking with you!

Best regards,
Hiring Team at ${companyName || 'our company'}`;

  await sendEmail(email, subject, text);

  // Insert into CANDIDATE dashboard notifications
  const dbMessage = `You have been shortlisted for the interview. Please check your interview link: ${interviewLink}`;
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
      [userId, dbMessage, 'interview']
    );
  } catch (_) {
    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
      [userId, dbMessage, 'interview']
    );
  }

  // Insert into MANAGER dashboard notifications
  if (managerId) {
    const managerMessage = `You scheduled an interview with ${candidateName} for the ${jobTitle} role. Link: ${interviewLink}`;
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
        [managerId, managerMessage, 'interview_scheduled']
      );
    } catch (_) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
        [managerId, managerMessage, 'interview_scheduled']
      );
    }
  }
}

async function sendPostAssessmentRejectionNotification(userId, email, candidateName, jobTitle, companyName, managerId) {
  const subject = `Update on your application - ${jobTitle} at ${companyName || 'our company'}`;
  const text = `Dear ${candidateName},

Thank you for your time in completing the assessment for the ${jobTitle} position at ${companyName || 'our company'}.
We regret to inform you that your application was not shortlisted for the interview round. We encourage you to apply for future opportunities.

Best regards,
Hiring Team at ${companyName || 'our company'}`;

  await sendEmail(email, subject, text);

  const dbMessage = `We regret to inform you that your application for ${jobTitle} was not shortlisted for the interview. We encourage you to apply for future opportunities.`;
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
      [userId, dbMessage, 'rejected']
    );
  } catch (_) {
    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
      [userId, dbMessage, 'rejected']
    );
  }

  // Insert into MANAGER dashboard notifications
  if (managerId) {
    const managerMessage = `You rejected candidate ${candidateName} for the ${jobTitle} role.`;
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
        [managerId, managerMessage, 'candidate_rejected']
      );
    } catch (_) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
        [managerId, managerMessage, 'candidate_rejected']
      );
    }
  }
}

module.exports = {
  sendAssessmentNotification,
  sendInterviewShortlistNotification,
  sendResumeShortlistNotification,
  createAtsStatusNotification,
  sendInterviewSetupNotification,
  sendPostAssessmentRejectionNotification
};
