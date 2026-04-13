const sendEmail = require('../utils/sendEmail');
const pool = require('../config/db');

async function createNotification(userId, message, type) {
  if (!userId) return;
  try {
    // 1. Insert new notification
    await pool.query(
      `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
      [userId, message, type]
    );

    // 2. Trim to 15 latest notifications (Feature request: "next should only 15 notifications remaining")
    await pool.query(
      `DELETE FROM notifications 
       WHERE id NOT IN (
         SELECT id FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 15
       ) AND user_id = $2`,
      [userId, userId]
    );
  } catch (_) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
        [userId, message, type]
      );
    } catch (e) {
      console.warn("Notification insert fallback failed:", e.message);
    }
  }
}

async function sendAssessmentNotification(userId, email, candidateName, jobRole, managerId, companyName) {
  // Backward compatibility: allow sendAssessmentNotification(email)
  if (typeof userId === 'string' && !email) {
    email = userId;
    userId = null;
    candidateName = 'Candidate';
    jobRole = 'applied';
  }

  // 1. Send Email
  const subject = `Action Required: Coding Assessment Invitation - ${jobRole} at ${companyName || 'Our Company'}`;
  const text = `Dear ${candidateName},

We are pleased to inform you that your profile has been successfully shortlisted for the ${jobRole} position at ${companyName || 'Our Company'}.

As the next step in our evaluation process, we kindly request you to complete an automated technical coding assessment. 

IMPORTANT: This assessment link is strictly valid for 24 hours from the time this email was sent.

Assessment Link:
https://assessments.shnoor.com

Please carefully read and follow these mandatory prerequisites to ensure a smooth testing experience:

BEFORE THE TEST:
• Ensure you have a highly stable internet connection.
• Find a quiet, well-lit room entirely free from distractions.
• Verify your webcam and microphone are working flawlessly.

DURING THE TEST:
• Do not switch tabs or open other applications under any circumstances; doing so will result in immediate disqualification.
• Keep your face clearly visible within the webcam frame at all times.
• The technical test must be completed in a single continuous session.

AFTER THE TEST:
• Ensure your responses are safely submitted before closing the browser window.
• You will receive an update regarding your application status via our Human Resources department securely via email.

We wish you the best of luck with the assessment.

Sincerely,
Talent Acquisition Team
${companyName || 'Our Company'}`;

  await sendEmail(email, subject, text);

  // 2. Insert into notifications table for the Candidate
  if (userId) {
    const candidateMsgObj = {
      title: `Assessment invitation: ${jobRole}`,
      text: `You have been shortlisted for the ${jobRole} role at ${companyName || 'our company'}. Complete the assessment within 24 hours.`,
      link: `https://assessments.shnoor.com`,
      time_limit: "24 hours from notification time",
      prerequisites: {
        before: "Ensure a stable internet connection. Find a quiet, well-lit environment. Verify webcam/mic.",
        during: "Do not switch tabs. Keep your face visible in the webcam frame at all times.",
        after: "Ensure submission is complete before closing. Await results via email."
      }
    };
    await createNotification(userId, JSON.stringify(candidateMsgObj), 'assessment');
  }

  // 3. Insert into notifications table for the Manager
  if (managerId) {
    const managerMsg = `Candidate ${candidateName} was shortlisted for ${jobRole}. Assessment instructions and 24-hour link were sent.`;
    await createNotification(managerId, managerMsg, 'candidate_shortlisted');
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

  await createNotification(userId, message, shortlistStatus);
}

async function sendInterviewSetupNotification(userId, email, candidateName, interviewLink, jobTitle, companyName, managerId) {
  const subject = `Action Required: Formal Interview Invitation - ${jobTitle} at ${companyName || 'Our Company'}`;
  const text = `Dear ${candidateName},

We are extremely pleased to formally inform you that you have been shortlisted for a live AI-assisted interview for the ${jobTitle} position at ${companyName || 'Our Company'}.

Please find your unique, secure interview session link below. 
IMPORTANT: Your interview link is strictly valid for 24 hours from the exact time of this communication.

Secure Interview Portal Link:
${interviewLink}

MANDATORY INTERVIEW PREPARATION:
• Please click the link and securely log in at least 5 minutes prior to your readiness to begin.
• Ensure your webcam and microphone are fully enabled and working properly.
• The interview will consist of a comprehensive mix of behavioral questions and role-specific technical discussions monitored by our AI system.
• Find a quiet, well-lit environment absolutely free of background noise.

Your application status has been officially updated to "Interview Scheduled" in our unified backend. We look forward to proceeding with your candidacy.

Sincerely,
Human Resources & Talent Acquisition
${companyName || 'Our Company'}`;

  await sendEmail(email, subject, text);

  // Insert into CANDIDATE dashboard notifications
  const dbMessage = `You have been shortlisted for the interview. Please check your interview link: ${interviewLink}`;
  await createNotification(userId, dbMessage, 'interview');

  // Insert into MANAGER dashboard notifications
  if (managerId) {
    const managerMessage = `You scheduled an interview with ${candidateName} for the ${jobTitle} role. Link: ${interviewLink}`;
    await createNotification(managerId, managerMessage, 'interview_scheduled');
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
  await createNotification(userId, dbMessage, 'rejected');

  // Insert into MANAGER dashboard notifications
  if (managerId) {
    const managerMessage = `You rejected candidate ${candidateName} for the ${jobTitle} role.`;
    await createNotification(managerId, managerMessage, 'candidate_rejected');
  }
}

async function sendNotShortlistedNotification(userId, email, candidateName, jobTitle, companyName) {
  const subject = `Application update for ${jobTitle}`;
  const text = `Dear ${candidateName},

Thank you for applying to the ${jobTitle} role at ${companyName || 'our company'}.

After reviewing your profile and assessment criteria, you were not shortlisted for the next stage at this time.
We truly appreciate your interest and encourage you to apply again for future opportunities.

Best regards,
Talent Acquisition Team
${companyName || 'Our Company'}`;

  if (email) await sendEmail(email, subject, text);
  await createNotification(
    userId,
    `Update: You were not shortlisted for ${jobTitle} at ${companyName || 'our company'}.`,
    'not_shortlisted'
  );
}

async function sendHiredNotification(userId, email, candidateName, jobTitle, companyName) {
  const subject = `Congratulations! You're hired for ${jobTitle} at ${companyName || 'our company'}`;
  const text = `Dear ${candidateName},

Congratulations! We are absolutely thrilled to inform you that you have successfully passed all rounds of the interview and assessment process. 
We would like to formally offer you the position of ${jobTitle} at ${companyName || 'our company'}.

Our HR department will be reaching out to you very soon in a separate email with your official offer letter, salary breakdown, and onboarding details.

Welcome to the team!

Warm regards,
Human Resources & Talent Acquisition
${companyName || 'Our Company'}`;

  if (email) await sendEmail(email, subject, text);
  
  await createNotification(
    userId,
    `Congratulations! You have been successfully hired for the ${jobTitle} role. Await further HR communications.`,
    'hired'
  );
}

async function sendInterviewResultNotification(managerId, candidateName, score, jobTitle, summary) {
  if (!managerId) return;

  const message = `Interview Completed: ${candidateName} for ${jobTitle} (Score: ${score}%). Summary: ${summary || 'No summary provided.'}`;
  
  // 1. DB Notification
  await createNotification(managerId, message, 'interview_result');

  // 2. Optional: Manager Email (if manager email was available, but here we prioritize dashboard)
  try {
    const manager = await pool.query('SELECT email FROM users WHERE id = $1', [managerId]);
    if (manager.rows.length) {
      const subject = `Interview Result: ${candidateName} - ${jobTitle}`;
      const text = `The technical AI interview for ${candidateName} is now complete.\n\nResult Summary:\nScore: ${score}%\nRole: ${jobTitle}\n\nYou can view the detailed proctoring and technical depth report in your manager dashboard.`;
      await sendEmail(manager.rows[0].email, subject, text);
    }
  } catch (err) {
    console.error("Manager Result Email Error:", err.message);
  }
}

module.exports = {
  sendAssessmentNotification,
  sendInterviewShortlistNotification,
  sendResumeShortlistNotification,
  createAtsStatusNotification,
  sendInterviewSetupNotification,
  sendPostAssessmentRejectionNotification,
  sendNotShortlistedNotification,
  sendHiredNotification,
  sendInterviewResultNotification
};
