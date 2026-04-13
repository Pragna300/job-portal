const pool = require("../db/db");
const { callAI } = require("../services/aiService");
const { extractResumeText } = require("../services/resumeService");
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

    res.json({ message: "Verified", token: linkData.token });
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

    // 3. Extract resume text using robust service
    let resumeText = "";
    try {
      resumeText = await extractResumeText(resumeUrl);
    } catch (e) {
      console.warn("PDF extraction failed, falling back to URL string:", e.message);
      resumeText = `Candidate Resume URL: ${resumeUrl}`;
    }

    if (!resumeText || resumeText.length < 10) {
      return res.status(400).json({
        error: "Resume content is unreadable",
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

    // 1. Fetch Proctoring Data for this session
    const proctoringRes = await pool.query(
      "SELECT * FROM proctoring_sessions WHERE application_id = $1 AND candidate_id = $2 ORDER BY created_at DESC LIMIT 1",
      [linkData.application_id, linkData.user_id]
    );
    
    let proctoringData = {
      integrity_score: 100,
      violation_count: 0,
      warnings_sent: 0,
      status: 'NOT_STARTED'
    };

    if (proctoringRes.rows.length) {
      const ps = proctoringRes.rows[0];
      proctoringData = {
        integrity_score: ps.integrity_score,
        violation_count: ps.violation_count,
        warnings_sent: ps.warnings_sent,
        status: ps.status
      };
      
      // Update session status to COMPLETED if active
      if (ps.status === 'ACTIVE') {
        await pool.query(
          "UPDATE proctoring_sessions SET status = 'COMPLETED', end_time = CURRENT_TIMESTAMP WHERE id = $1",
          [ps.id]
        );
      }
    }

    // 2. Call AI Evaluation with added proctoring context
    const rawEval = await callAI(evaluationPrompt(answers, proctoringData));
    const evaluation = safeJsonParse(rawEval);

    if (!evaluation)
      return res.status(500).json({ error: "AI evaluation failed" });

    const userId = linkData.user_id;
    const applicationId = linkData.application_id;

    // 3. Store Results
    await pool.query(
      "INSERT INTO interview_results(user_id, application_id, score, feedback) VALUES($1, $2, $3, $4)",
      [
        userId,
        applicationId,
        evaluation.overall_score,
        JSON.stringify({ ...evaluation, proctoring: proctoringData }),
      ]
    );

    // 4. Mark Link as Used
    await pool.query(
      "UPDATE interview_links SET is_used=true WHERE token=$1",
      [token]
    );

    // 5. Update Application Status (Keep Core App in sync)
    try {
      await pool.query(
        "UPDATE applications SET status = $1, test_score = $2, test_status = $3 WHERE id = $4",
        ["test_completed", evaluation.overall_score, "completed", linkData.application_id]
      );
    } catch (e) {
      console.warn("Application status sync error:", e.message);
    }

    // Notify Manager about result (Cross-service call to Core Backend)
    try {
      const axios = require('axios');
      const managerInfo = await pool.query(
        `SELECT c.manager_id, u.name as candidate_name, j.title as job_title 
         FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         JOIN companies c ON j.company_id = c.id 
         JOIN users u ON a.user_id = u.id 
         WHERE a.id = $1`,
        [linkData.application_id]
      );

      if (managerInfo.rows.length) {
        const { manager_id, candidate_name, job_title } = managerInfo.rows[0];
        const coreBackendUrl = process.env.CORE_BACKEND_URL || "http://localhost:5000";
        
        await axios.post(`${coreBackendUrl}/api/notifications/notify-manager-result`, {
          managerId: manager_id,
          candidateName: candidate_name,
          score: evaluation.overall_score,
          jobTitle: job_title,
          summary: evaluation.summary || evaluation.overall_feedback || "No summary available."
        }).catch(err => console.warn("Manager notification call failed:", err.message));
      }
    } catch (e) {
      console.warn("Manager notification logic failed:", e.message);
    }

    res.json({
      message: "Interview submitted",
      evaluation: { ...evaluation, proctoring: proctoringData },
    });
  } catch (err) {
    console.error("Submit Interview Error:", err);
    res.status(500).json({ error: err.message });
  }
};