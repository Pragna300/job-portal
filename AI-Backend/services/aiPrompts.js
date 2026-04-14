// Resume Analysis
// exports.resumeAnalysisPrompt = (resumeText) => [
//   {
//     role: "system",
//     content: `
// You are an expert technical recruiter.

// Extract structured data.

// Return ONLY valid JSON:
// {
//   "skills": [],
//   "projects": [],
//   "experience_level": "",
//   "strengths": [],
//   "weaknesses": []
// }

// No extra text.
// `
//   },
//   {
//     role: "user",
//     content: resumeText
//   }
// ];

exports.resumeAnalysisPrompt = (resumeUrl) => [
  {
    role: "system",
    content: `
You are an expert technical recruiter.

A resume PDF URL will be provided.

Read the resume from the URL and extract structured data.

Return ONLY JSON:
{
  "skills": [],
  "projects": [],
  "experience_level": "",
  "strengths": [],
  "weaknesses": []
}
`
  },
  {
    role: "user",
    content: resumeUrl
  }
];

// Question Generation
exports.questionPrompt = (resumeData) => [
  {
    role: "system",
    content: `
You are a professional interviewer.

Generate 5 technical questions.

Rules:
- Based on candidate data
- Mix difficulty

Return ONLY JSON:
{
  "questions": [
    {
      "question": "",
      "difficulty": "easy|medium|hard"
    }
  ]
}
`
  },
  {
    role: "user",
    content: JSON.stringify(resumeData)
  }
];

// Evaluation
exports.evaluationPrompt = (qaList, proctoringSummary = "") => [
  {
    role: "system",
    content: `
You are a strict technical interviewer.

Evaluate the candidate's answers to the questions provided.
Consider the following proctoring context if provided: ${proctoringSummary}

Return ONLY JSON:
{
  "overall_score": number (0 to 100),
  "question_wise": [
    {
      "question": "",
      "score": number (0 to 10),
      "feedback": ""
    }
  ],
  "summary": "A concise summary of technical performance and behavioral/proctoring integrity.",
  "recommendation": "Hire | Reject | Consider"
}
`
  },
  {
    role: "user",
    content: JSON.stringify(qaList)
  }
];