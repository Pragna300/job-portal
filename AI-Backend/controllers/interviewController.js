const pool = require("../db/db");
const { callAI } = require("../services/aiService");
const {
  resumeAnalysisPrompt,
  questionPrompt,
  evaluationPrompt,
} = require("../services/aiPrompts");

const safeJsonParse = require("../utils/safeJson");

// VERIFY USER
exports.verifyUser = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const link = await pool.query(
      `
      SELECT il.*
      FROM interview_links il
      JOIN users u ON il.user_id = u.id
      WHERE u.email = $1
      AND il.is_used = false
      AND il.expires_at > NOW()
      ORDER BY il.expires_at DESC
      LIMIT 1
      `,
      [email]
    );

    if (!link.rows.length) {
      return res.status(400).json({
        error: "No valid interview link found"
      });
    }

    console.log("VerifyUser: SUCCESS", {
      email,
      userId: link.rows[0].user_id,
      token: link.rows[0].token
    });

    return res.json({
      success: true,
      token: link.rows[0].token,
      userId: link.rows[0].user_id,
      user_id: link.rows[0].user_id,
      id: link.rows[0].user_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error"
    });
  }
};

// GENERATE QUESTIONS
exports.generateQuestions = async (req, res) => {
  const { token } = req.params;

  try {
    // 1. Validate token
    const link = await pool.query(
      "SELECT * FROM interview_links WHERE token=$1",
      [token]
    );

    if (!link.rows.length) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const linkData = link.rows[0];

    if (linkData.is_used) {
      return res.status(400).json({ error: "Link already used" });
    }

    if (new Date(linkData.expires_at) < new Date()) {
      return res.status(400).json({ error: "Link expired" });
    }

    const userId = linkData.user_id;

    // 2. Get latest resume from applications table
    const application = await pool.query(
      `SELECT resume_url 
       FROM applications 
       WHERE user_id = $1 
       ORDER BY applied_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (!application.rows.length || !application.rows[0].resume_url) {
      return res.status(400).json({
        error: "No resume found for user in applications",
      });
    }

    const resumeUrl = application.rows[0].resume_url;

    // Optional safety check
    if (!resumeUrl.startsWith("http")) {
      return res.status(400).json({
        error: "Invalid resume URL format",
      });
    }

    // 3. Extract resume text
    const resumeText = resumeUrl;

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        error: "Resume content is too short or unreadable",
      });
    }

    // 4. Resume Analysis (AI)
    const rawResume = await callAI(resumeAnalysisPrompt(resumeText));
    const resumeData = safeJsonParse(rawResume);

    if (!resumeData) {
      console.error("Resume AI Raw:", rawResume);
      return res.status(500).json({
        error: "AI resume parsing failed",
      });
    }

    // 5. Generate Questions (AI)
    const rawQuestions = await callAI(questionPrompt(resumeData));
    const questions = safeJsonParse(rawQuestions);

    if (!questions) {
      console.error("Questions AI Raw:", rawQuestions);
      return res.status(500).json({
        error: "AI question generation failed",
      });
    }

    // 6. Send response
    res.json(questions);

  } catch (err) {
    console.error("Generate Questions Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// SUBMIT INTERVIEW
exports.submitInterview = async (req, res) => {
  const { token, answers } = req.body;

  try {
    console.log(`Starting interview submission for token: ${token}`);
    
    const link = await pool.query(
      "SELECT * FROM interview_links WHERE token=$1",
      [token]
    );

    if (!link.rows.length) {
      console.error(`Invalid token attempt: ${token}`);
      return res.status(400).json({ error: "Invalid token" });
    }

    const userId        = link.rows[0].user_id;
    let   applicationId = link.rows[0].application_id;

    // Fallback: look up application_id from applications table if not on the link
    if (!applicationId) {
      const appRes = await pool.query(
        "SELECT id FROM applications WHERE user_id = $1 ORDER BY applied_at DESC LIMIT 1",
        [userId]
      );
      if (appRes.rows.length) {
        applicationId = appRes.rows[0].id;
      }
    }

    if (!applicationId) {
      console.error("No application_id found for user:", userId);
      return res.status(400).json({ error: "No application found for this candidate." });
    }

    // Fetch proctoring data if available (optional context for AI)
    let proctoringSummary = "";
    try {
      const sessionRes = await pool.query(
        "SELECT integrity_score FROM proctoring_sessions WHERE candidate_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      if (sessionRes.rows.length > 0) {
        proctoringSummary = `Proctoring Integrity Score: ${sessionRes.rows[0].integrity_score}/100. `;
      }
    } catch {
      console.warn("Could not fetch proctoring data for evaluation context.");
    }

    console.log(`Calling AI for evaluation. Total answers: ${answers?.length}`);
    const rawEval  = await callAI(evaluationPrompt(answers, proctoringSummary));
    const evaluation = safeJsonParse(rawEval);

    if (!evaluation) {
      console.error("AI evaluation returned null or invalid JSON:", rawEval);
      return res.status(500).json({ error: "AI evaluation failed to generate valid analysis" });
    }

    console.log(`Saving interview results to DB for user ID: ${userId}, application ID: ${applicationId}`);
    await pool.query(
      `INSERT INTO interview_results(
        user_id,
        application_id,
        overall_score, 
        feedback, 
        ai_recommendation, 
        questions_asked, 
        questions_answered
      ) VALUES($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        applicationId,
        evaluation.overall_score || 0,
        JSON.stringify(evaluation),
        evaluation.recommendation || "Consider",
        answers?.length || 0,
        answers?.filter(a => a.answer?.length > 5).length || 0,
      ]
    );

    await pool.query(
      "UPDATE interview_links SET is_used=true WHERE token=$1",
      [token]
    );

    // ── Notify main backend: status → test_completed ──────────────────────
    try {
      const coreUrl = process.env.CORE_BACKEND_URL || "http://localhost:5000";
      const internalKey = process.env.INTERNAL_API_KEY || "";
      await fetch(`${coreUrl}/applications/internal/mark-completed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": internalKey,
        },
        body: JSON.stringify({
          application_id: applicationId,
          user_id: userId,
          test_score: evaluation.overall_score || 0,
        }),
      });
      console.log("Main backend notified: application marked test_completed.");
    } catch (notifyErr) {
      // Non-fatal — don't block the response
      console.warn("Could not notify main backend:", notifyErr.message);
    }
    // ──────────────────────────────────────────────────────────────────────

    console.log("Interview submission completed successfully.");
    res.json({
      message: "Interview submitted",
      evaluation,
    });
  } catch (err) {
    console.error("Critical error during Submit Interview:", err);
    res.status(500).json({ error: err.message });
  }
};