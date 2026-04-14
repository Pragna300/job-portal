const pool = require('../config/db');

exports.startSession = async (req, res) => {
  try {
    const { candidateId } = req.body;
    // Check if session already exists and active
    let sessionResult = await pool.query(
      "SELECT * FROM proctoring_sessions WHERE candidate_id = $1 AND status = 'ACTIVE'",
      [candidateId]
    );

    let sessionId;
    if (sessionResult.rows.length === 0) {
      // Create new session
      const newSession = await pool.query(
        "INSERT INTO proctoring_sessions (candidate_id, status, integrity_score) VALUES ($1, 'ACTIVE', 100) RETURNING id",
        [candidateId]
      );
      sessionId = newSession.rows[0].id;
    } else {
      sessionId = sessionResult.rows[0].id;
    }

    res.status(200).json({ message: 'Session started successfully', sessionId });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Server error starting session' });
  }
};

exports.reportViolation = async (req, res) => {
  try {
    const { candidateId, sessionId, violationType } = req.body;
    const io = req.app.get('io');
    
    // Determine penalty based on rule
    let penalty = 0;
    if (violationType === 'TAB_SWITCH') penalty = 10;
    else if (violationType === 'FACE_NOT_DETECTED') penalty = 15;
    else if (violationType === 'CAMERA_OFF') penalty = 20;
    else if (violationType === 'MULTIPLE_FACES') penalty = 25;

    // Insert violation log
    await pool.query(
      "INSERT INTO violations_log (proctoring_session_id, violation_type, integrity_reduction) VALUES ($1, $2, $3)",
      [sessionId, violationType, penalty]
    );

    // Update integrity score
    const updatedSession = await pool.query(
      "UPDATE proctoring_sessions SET integrity_score = GREATEST(0, integrity_score - $1) WHERE id = $2 RETURNING integrity_score",
      [penalty, sessionId]
    );

    const newIntegrity = updatedSession.rows[0].integrity_score;

    // Emit socket event to admin to update dashboard instantly
    if (io) {
      io.of('/admin').emit('violation-detected', {
        candidateId,
        sessionId,
        violationType,
        newIntegrity
      });
      io.of('/admin').emit('integrity-score-update', {
        candidateId,
        sessionId,
        integrityScore: newIntegrity
      });
    }

    // Check existing warnings and issue an automatic warning for this violation
    const warningsResult = await pool.query(
      "SELECT COUNT(*) FROM warnings_log WHERE proctoring_session_id = $1",
      [sessionId]
    );
    const existingWarnings = parseInt(warningsResult.rows[0].count);
    const newWarningNumber = existingWarnings + 1;

    // Only insert a warning if we haven't crossed the threshold already
    if (newWarningNumber <= 3) {
      await pool.query(
        "INSERT INTO warnings_log (proctoring_session_id, warning_number, message) VALUES ($1, $2, $3)",
        [sessionId, newWarningNumber, "Automatic warning for violation"]
      );

      // Alert candidate they received automatic warning
      if (io) {
        io.of('/candidate').to(`candidate-${candidateId}`).emit('receive-warning', {
          warningNumber: newWarningNumber,
          message: `Warning ${newWarningNumber}/3: Violation detected (${violationType}). The next warning may result in termination.`
        });
        
        // Alert admin
        io.of('/admin').emit('warning-sent', {
          candidateId,
          sessionId,
          warningNumber: newWarningNumber
        });
      }
    }

    if (newWarningNumber >= 3) {
      return exports.executeTermination(candidateId, sessionId, 'MAX_WARNINGS_EXCEEDED', io, res);
    }

    res.status(200).json({ message: 'Violation reported', integrityScore: newIntegrity });
  } catch (error) {
    console.error('Error reporting violation:', error);
    res.status(500).json({ message: 'Server error reporting violation' });
  }
};

exports.sendWarning = async (req, res) => {
  try {
    const { candidateId, sessionId } = req.body;
    const io = req.app.get('io');

    // Count existing warnings
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM warnings_log WHERE proctoring_session_id = $1",
      [sessionId]
    );
    const existingWarnings = parseInt(countResult.rows[0].count);
    const newWarningNumber = existingWarnings + 1;

    if (newWarningNumber > 3) {
      return res.status(400).json({ message: 'Max warnings already exceeded. Terminate session.' });
    }

    // Insert warning
    await pool.query(
      "INSERT INTO warnings_log (proctoring_session_id, warning_number, message) VALUES ($1, $2, $3)",
      [sessionId, newWarningNumber, "Manual warning sent by admin"]
    );

    // Emit socket to candidate
    if (io) {
      io.of('/candidate').to(`candidate-${candidateId}`).emit('receive-warning', {
        warningNumber: newWarningNumber,
        message: `Warning ${newWarningNumber}/3: Please ensure you adhere to the interview rules. The next warning may result in termination.`
      });
      
      // Emit update back to admin just in case
      io.of('/admin').emit('warning-sent', {
        candidateId,
        sessionId,
        warningNumber: newWarningNumber
      });
    }

    // Auto terminate if 3 warnings reached
    if (newWarningNumber === 3) {
      // Call local terminate logic
      return exports.executeTermination(candidateId, sessionId, 'MAX_WARNINGS_EXCEEDED', io, res);
    }

    res.status(200).json({ message: 'Warning sent', warningNumber: newWarningNumber });
  } catch (error) {
    console.error('Error sending warning:', error);
    res.status(500).json({ message: 'Server error sending warning' });
  }
};

exports.terminateInterview = async (req, res) => {
  try {
    const { candidateId, sessionId } = req.body;
    const io = req.app.get('io');
    return exports.executeTermination(candidateId, sessionId, 'ADMIN_TERMINATED', io, res);
  } catch (error) {
    console.error('Error terminating interview:', error);
    res.status(500).json({ message: 'Server error terminating interview' });
  }
};

exports.executeTermination = async (candidateId, sessionId, reason, io, res) => {
  try {
    await pool.query(
      "UPDATE proctoring_sessions SET status = 'TERMINATED', end_time = CURRENT_TIMESTAMP, termination_reason = $1 WHERE id = $2",
      [reason, sessionId]
    );

    // Emit termination to candidate
    if (io) {
      io.of('/candidate').to(`candidate-${candidateId}`).emit('terminate-interview', { reason });
      io.of('/admin').emit('interview-terminated', { candidateId, sessionId, reason });
    }

    if (res) {
      return res.status(200).json({ message: 'Interview terminated', reason });
    }
  } catch (error) {
    console.error('Termination execution error:', error);
    if (res) return res.status(500).json({ message: 'Server error during termination' });
  }
};

exports.getLiveCandidates = async (req, res) => {
  try {
    // Join with Users table to get candidate Name
    const result = await pool.query(`
      SELECT 
        isess.id as session_id,
        isess.candidate_id,
        u.name as candidate_name,
        u.email,
        u.profile_pic,
        isess.status,
        isess.integrity_score,
        isess.created_at as start_time,
        (SELECT COUNT(*) FROM violations_log WHERE proctoring_session_id = isess.id) as violation_count,
        (SELECT COUNT(*) FROM warnings_log WHERE proctoring_session_id = isess.id) as warnings_count
      FROM proctoring_sessions isess
      JOIN users u ON isess.candidate_id = u.id
      ORDER BY isess.created_at DESC
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting live candidates:', error);
    res.status(500).json({ message: 'Server error fetching candidates' });
  }
};

exports.getSessionSummary = async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    // Get latest session
    const sessionRes = await pool.query(
      "SELECT * FROM proctoring_sessions WHERE candidate_id = $1 ORDER BY created_at DESC LIMIT 1",
      [candidateId]
    );
    
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ message: 'No session found for this candidate' });
    }
    
    const session = sessionRes.rows[0];
    
    const violations = await pool.query(
      "SELECT violation_type, count(*) as count FROM violations_log WHERE proctoring_session_id = $1 GROUP BY violation_type",
      [session.id]
    );
    
    const warnings = await pool.query(
      "SELECT COUNT(*) FROM warnings_log WHERE proctoring_session_id = $1",
      [session.id]
    );

    const userRes = await pool.query("SELECT name FROM users WHERE id = $1", [candidateId]);
    
    const resultsData = await pool.query(
      "SELECT questions_asked, questions_answered, average_score, overall_score, ai_recommendation, feedback FROM interview_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [candidateId]
    );
    
    const aiResult = resultsData.rows[0] || {};
    
    res.status(200).json({
      candidateName: userRes.rows[0]?.name,
      status: session.status,
      integrityScore: session.integrity_score,
      totalViolations: violations.rows.reduce((acc, curr) => acc + parseInt(curr.count), 0),
      violationBreakdown: violations.rows,
      warningsCount: parseInt(warnings.rows[0].count),
      terminationReason: session.termination_reason,
      startTime: session.created_at,
      endTime: session.end_time,
      duration: session.end_time ? Math.round((new Date(session.end_time) - new Date(session.created_at)) / 1000) : null,
      questionsAsked: aiResult.questions_asked,
      questionsAnswered: aiResult.questions_answered,
      averageScore: aiResult.average_score,
      overallScore: aiResult.overall_score,
      aiRecommendation: aiResult.ai_recommendation,
      summary: aiResult.feedback?.summary || aiResult.feedback?.result?.summary || ''
    });
  } catch (error) {
    console.error('Error getting session summary:', error);
    res.status(500).json({ message: 'Server error getting summary' });
  }
};

exports.cleanupSessions = async (req, res) => {
  try {
    // Delete non-active sessions (COMPLETED, TERMINATED)
    await pool.query("DELETE FROM proctoring_sessions WHERE status != 'ACTIVE'");
    res.status(200).json({ message: 'Stale sessions cleared successfully' });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ message: 'Cleanup failed' });
  }
};
