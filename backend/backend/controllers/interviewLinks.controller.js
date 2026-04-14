const Company = require('../models/company.model');
const User = require('../models/user.model');
const pool = require('../config/db');
const InterviewLink = require('../models/interviewLink.model');
const InterviewResult = require('../models/interviewResult.model');
const sendEmail = require('../utils/sendEmail');

function buildInterviewUrl(token) {
  const frontendUrl = process.env.INTERVIEW_FRONTEND_URL || "http://localhost:5174";
  return `${frontendUrl}/interview/${token}`;
}

async function assertManagerCanAccessCandidate(managerId, candidateUserId) {
  const company = await Company.findByManagerId(managerId);
  if (!company) return false;

  const { rows } = await pool.query(
    `SELECT 1
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.user_id = $1
       AND j.company_id = $2
     LIMIT 1`,
    [candidateUserId, company.id]
  );
  return rows.length > 0;
}

const sendInterviewLink = async (req, res) => {
  try {
    const candidateUserId = parseInt(req.params.user_id, 10);
    if (Number.isNaN(candidateUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    // Role permissions:
    // - admin can generate for any candidate
    // - manager can generate only for candidates who applied to their company
    if (req.user.role === 'manager') {
      const allowed = await assertManagerCanAccessCandidate(req.user.id, candidateUserId);
      if (!allowed) return res.status(403).json({ message: 'Unauthorized' });
    }

    const candidate = await User.findById(candidateUserId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const { rows: appRows } = await pool.query(
      'SELECT id FROM applications WHERE user_id = $1 ORDER BY applied_at DESC LIMIT 1',
      [candidateUserId]
    );
    if (appRows.length === 0) {
      return res.status(400).json({ message: 'Candidate has no active applications' });
    }
    const applicationId = appRows[0].id;

    const linkRow = await InterviewLink.createForUser(candidateUserId, applicationId);
    const interviewLink = buildInterviewUrl(linkRow.token);

    // Email notification
    const subject = 'Interview Shortlisted';
    const text =
      `You have been shortlisted for the interview. Please use the link below to attend your interview.\n\n` +
      `${interviewLink}\n`;
    await sendEmail(candidate.email, subject, text);

    // Candidate dashboard notification (optional but enabled)
    const panelMessage = 'You have been shortlisted for the interview. Please check your interview link.';
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, message, status, created_at) VALUES ($1, $2, $3, NOW())`,
        [candidateUserId, panelMessage, 'interview']
      );
    } catch (_) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
        [candidateUserId, panelMessage, 'interview']
      );
    }

    return res.json({
      user_id: candidateUserId,
      token: linkRow.token,
      expires_at: linkRow.expires_at,
      interview_link: interviewLink
    });
  } catch (error) {
    console.error('sendInterviewLink error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getInterviewResults = async (req, res) => {
  try {
    const candidateUserId = parseInt(req.params.user_id, 10);
    if (Number.isNaN(candidateUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (req.user.role === 'manager') {
      const allowed = await assertManagerCanAccessCandidate(req.user.id, candidateUserId);
      if (!allowed) return res.status(403).json({ message: 'Unauthorized' });
    }

    // Fetch the full row including the stored AI evaluation JSON
    const { rows } = await pool.query(
      `SELECT ir.user_id, ir.overall_score, ir.feedback, ir.ai_recommendation,
              ir.questions_asked, ir.questions_answered, ir.created_at,
              u.name AS candidate_name, u.email AS candidate_email
       FROM interview_results ir
       LEFT JOIN users u ON u.id = ir.user_id
       WHERE ir.user_id = $1
       ORDER BY ir.created_at DESC
       LIMIT 1`,
      [candidateUserId]
    );

    if (!rows.length) {
      return res.json({ user_id: candidateUserId, score: null, feedback: null });
    }

    const row = rows[0];

    // Fetch proctoring session and violations
    let violations = [];
    let integrity_score = 100;
    try {
      const sessionRes = await pool.query(
        "SELECT id, integrity_score FROM proctoring_sessions WHERE candidate_id = $1 ORDER BY created_at DESC LIMIT 1",
        [candidateUserId]
      );
      if (sessionRes.rows.length > 0) {
        integrity_score = sessionRes.rows[0].integrity_score;
        const sessionId = sessionRes.rows[0].id;
        const violationsRes = await pool.query(
          "SELECT violation_type, count(*) as count FROM violations_log WHERE proctoring_session_id = $1 GROUP BY violation_type",
          [sessionId]
        );
        violations = violationsRes.rows;
      }
    } catch(err) {
      console.error("Error fetching violations:", err);
    }

    // feedback column stores the full AI evaluation JSON object
    let evalData = row.feedback;
    if (typeof evalData === 'string') {
      try { evalData = JSON.parse(evalData); } catch { evalData = {}; }
    }

    return res.json({
      user_id:           row.user_id,
      candidate_name:    row.candidate_name,
      candidate_email:   row.candidate_email,
      score:             row.overall_score,
      recommendation:    row.ai_recommendation || evalData?.recommendation || 'Consider',
      summary:           evalData?.summary || '',
      strengths:         evalData?.strengths || [],
      weaknesses:        evalData?.weaknesses || [],
      per_question:      evalData?.per_question || evalData?.answers || [],
      violations:        violations,
      integrity_score:   integrity_score,
      questions_asked:   row.questions_asked,
      questions_answered: row.questions_answered,
      completed_at:      row.created_at,
    });
  } catch (error) {
    console.error('getInterviewResults error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  sendInterviewLink,
  getInterviewResults
};

