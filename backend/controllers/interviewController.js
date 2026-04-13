const pool = require("../config/db");
const { callAI } = require("../services/aiService");
const { extractResumeText } = require("../utils/resumeParser");
const {
  resumeAnalysisPrompt,
  questionPrompt,
  evaluationPrompt,
} = require("../services/aiPrompts");

const safeJsonParse = require("../utils/safeJson");

// VERIFY USER
exports.verifyUser = async (req, res) => {
  const { token, email } = req.body;

  try {
    const link = await pool.query(
      "SELECT * FROM interview_links WHERE token=$1",
      [token]
    );

    if (!link.rows.length)
      return res.status(400).json({ error: "Invalid token" });

    const linkData = link.rows[0];

    if (linkData.is_used)
      return res.status(400).json({ error: "Link already used" });

    if (new Date(linkData.expires_at) < new Date())
      return res.status(400).json({ error: "Link expired" });

    const user = await pool.query(
      "SELECT * FROM users WHERE id=$1 AND email=$2",
      [linkData.user_id, email]
    );

    if (!user.rows.length)
      return res.status(401).json({ error: "Invalid email" });

    res.json({ message: "Verified", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const resumeText = await extractResumeText(resumeUrl).catch(() => "");

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

    // Feature 5: Integrate Proctoring Data
    const proctoringRes = await pool.query(
      "SELECT * FROM proctoring_sessions WHERE application_id = $1 AND candidate_id = $2 ORDER BY created_at DESC LIMIT 1",
      [linkData.application_id, linkData.user_id]
    );
    
    let proctoringData = {};
    if (proctoringRes.rows.length) {
      const ps = proctoringRes.rows[0];
      proctoringData = {
        integrity_score: ps.integrity_score,
        violation_count: ps.violation_count,
        warnings_sent: ps.warnings_sent
      };
      // Mark session as COMPLETED if it was still active
      if (ps.status === 'ACTIVE') {
        await pool.query(
          "UPDATE proctoring_sessions SET status = 'COMPLETED', end_time = CURRENT_TIMESTAMP WHERE id = $1",
          [ps.id]
        );
      }
    }

    const rawEval = await callAI(evaluationPrompt(answers, proctoringData));
    const evaluation = safeJsonParse(rawEval);

    if (!evaluation)
      return res.status(500).json({ error: "AI evaluation failed" });

    await pool.query(
      "INSERT INTO interview_results (user_id, application_id, score, feedback) VALUES ($1, $2, $3, $4)",
      [
        linkData.user_id,
        linkData.application_id,
        evaluation.overall_score,
        JSON.stringify({ ...evaluation, proctoring: proctoringData }),
      ]
    );

    await pool.query(
      "UPDATE interview_links SET is_used=true WHERE token=$1",
      [token]
    );

    try {
      await pool.query(
        "UPDATE applications SET status = $1, test_score = $2, test_status = $3 WHERE id = $4",
        ["test_completed", evaluation.overall_score, "completed", linkData.application_id]
      );
    } catch (e) {
      console.warn("applications test columns update skipped:", e.message);
    }

    res.json({
      message: "Interview submitted",
      evaluation: { ...evaluation, proctoring: proctoringData },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};