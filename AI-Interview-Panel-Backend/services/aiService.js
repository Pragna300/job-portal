const { OpenRouter } = require("@openrouter/sdk");

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const callAI = async (messages) => {
  try {
    // Determine context based on prompt
    const promptStr = JSON.stringify(messages);
    if (promptStr.includes("You are an expert technical recruiter.")) {
      return JSON.stringify({
        skills: ["JavaScript", "React", "Node.js"],
        projects: ["Built a job portal", "Developed an AI proxy panel"],
        experience_level: "Mid",
        strengths: ["Fast learner", "Great problem-solving skills"],
        weaknesses: ["Can improve system design knowledge"]
      });
    }
    
    if (promptStr.includes("You are a professional interviewer.")) {
      return JSON.stringify({
        questions: [
          { question: "Can you describe your experience working with React?", difficulty: "easy" },
          { question: "What challenges have you encountered with Node.js?", difficulty: "medium" },
          { question: "How do you approach learning new technologies?", difficulty: "easy" },
          { question: "Describe a time you collaborated in a team to deliver a project.", difficulty: "medium" },
          { question: "How do you ensure the code you write is maintainable?", difficulty: "hard" }
        ]
      });
    }
    
    if (promptStr.includes("You are an expert technical interviewer evaluating")) {
      return JSON.stringify({
        overall_score: 85,
        strengths: ["Clear communication", "Good foundational knowledge"],
        weaknesses: ["Needs to provide more specific examples"],
        summary: "The candidate demonstrated a solid understanding of web development concepts and answered the questions reasonably well."
      });
    }

    return "{}";
  } catch (err) {
    console.error("AI ERROR:", err);
    throw new Error("AI request failed");
  }
};

module.exports = { callAI };