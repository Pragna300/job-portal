const pool = require("../config/db");
const { callAI } = require("../services/aiService");

exports.startSession = async (req, res) => {
  const { token } = req.body;
  try {
    // Look up candidate from the interview token
    const linkRes = await pool.query(
      "SELECT user_id, application_id FROM interview_links WHERE token = $1",
      [token]
    );

    if (!linkRes.rows.length) {
      // No link found — create a lightweight session without FK constraints
      const result = await pool.query(
        `INSERT INTO proctoring_sessions (candidate_id, application_id, status)
         VALUES (NULL, NULL, 'ACTIVE') RETURNING id`
      );
      return res.json({ sessionId: result.rows[0].id, candidateId: "anonymous" });
    }

    const { user_id, application_id } = linkRes.rows[0];

    // Check if active session already exists
    const existing = await pool.query(
      "SELECT id FROM proctoring_sessions WHERE candidate_id=$1 AND application_id=$2 AND status='ACTIVE'",
      [user_id, application_id]
    );
    if (existing.rows.length) {
      return res.json({ sessionId: existing.rows[0].id, candidateId: user_id });
    }

    const result = await pool.query(
      `INSERT INTO proctoring_sessions (candidate_id, application_id, status)
       VALUES ($1, $2, 'ACTIVE') RETURNING id`,
      [user_id, application_id]
    );
    res.json({ sessionId: result.rows[0].id, candidateId: user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reportViolation = async (req, res) => {
  const { sessionId, violationType } = req.body;
  
  // Feature 2: Specific point deductions
  const deductions = {
    'TAB_SWITCH': 10,
    'FACE_NOT_DETECTED': 15,
    'CAMERA_OFF': 20,
    'MULTIPLE_FACES': 25,
    'MOBILE_PHONE_DETECTED': 20
  };

  const integrityReduction = deductions[violationType] || 5;

  try {
    await pool.query(
      `INSERT INTO violations_log (proctoring_session_id, violation_type, integrity_reduction)
       VALUES ($1, $2, $3)`,
      [sessionId, violationType, integrityReduction]
    );

    const updatedSession = await pool.query(
      `UPDATE proctoring_sessions 
       SET integrity_score = GREATEST(0, integrity_score - $1),
           violation_count = violation_count + 1
       WHERE id = $2
       RETURNING integrity_score, violation_count`,
      [integrityReduction, sessionId]
    );

    res.json({ 
      message: "Violation reported", 
      integrityScore: updatedSession.rows[0].integrity_score,
      violationCount: updatedSession.rows[0].violation_count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.terminateSession = async (req, res) => {
  const { sessionId, reason } = req.body;
  try {
    await pool.query(
      `UPDATE proctoring_sessions 
       SET status = 'TERMINATED', end_time = CURRENT_TIMESTAMP, termination_reason = $1
       WHERE id = $2`,
      [reason, sessionId]
    );
    res.json({ message: "Session terminated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disqualifyCandidate = async (req, res) => {
  const { sessionId, reason } = req.body;
  try {
    // Mark session as DISQUALIFIED
    const sess = await pool.query(
      `UPDATE proctoring_sessions 
       SET status = 'DISQUALIFIED', end_time = CURRENT_TIMESTAMP, termination_reason = $1
       WHERE id = $2 RETURNING candidate_id, application_id`,
      [reason || 'Violation threshold exceeded', sessionId]
    );
    if (sess.rows.length > 0) {
      const { application_id } = sess.rows[0];
      // Invalidate the interview link immediately to prevent re-entry after disqualification
      await pool.query(
        `UPDATE interview_links SET is_used = true WHERE application_id = $1`,
        [application_id]
      ).catch(() => {});

      // Mark application as rejected
      await pool.query(
        `UPDATE applications SET status = 'rejected' WHERE id = $1`,
        [application_id]
      ).catch(() => {});
    }
    res.json({ message: 'Candidate disqualified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, u.name as candidate_name, a.job_id
       FROM proctoring_sessions ps
       JOIN users u ON ps.candidate_id = u.id
       JOIN applications a ON ps.application_id = a.id
       WHERE ps.status = 'ACTIVE'
       ORDER BY ps.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSessionSummary = async (req, res) => {
  const { candidateId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ps.*, u.name as candidate_name, 
              (SELECT json_agg(vl) FROM violations_log vl WHERE vl.proctoring_session_id = ps.id) as violations
       FROM proctoring_sessions ps
       JOIN users u ON ps.candidate_id = u.id
       WHERE ps.candidate_id = $1
       ORDER BY ps.created_at DESC LIMIT 1`,
      [candidateId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopCandidates = async (req, res) => {
  const { jobId } = req.params;
  // Dynamic threshold logic:
  // Base floor = 75. 
  // Aim for top 5-10.
  try {
    const { rows: candidates } = await pool.query(
      `SELECT ps.*, ir.score as interview_score, u.name as candidate_name
       FROM proctoring_sessions ps
       JOIN interview_results ir ON ps.application_id = ir.application_id
       JOIN users u ON ps.candidate_id = u.id
       JOIN applications a ON ps.application_id = a.id
       WHERE a.job_id = $1 AND ir.score >= 75
       ORDER BY ir.score DESC`,
      [jobId]
    );

    // If more than 10, slice to top 10 (or dynamic threshold)
    const topCandidates = candidates.slice(0, 10);
    res.json(topCandidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
