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
exports.evaluationPrompt = (qaList, proctoringData = {}) => [
  {
    role: "system",
    content: `
You are a strict technical interviewer and proctoring analyst.

Evaluate the technical answers. 
Also, consider the following proctoring integrity data:
${JSON.stringify(proctoringData)}

Strict Rules:
- If integrity score is below 70, you MUST mention it in the summary.
- If warnings_sent > 0, include a note about rule violations.
- Provide a final hiring recommendation based on BOTH technical accuracy and interview integrity.

Return ONLY JSON:
{
  "overall_score": number, // Scale: 0 to 100
  "question_wise": [
    {
      "question": "",
      "score": number, // Scale: 0 to 100
      "feedback": ""
    }
  ],
  "integrity_context": "",
  "summary": "",
  "recommendation": "Hire | Reject | Consider"
}
`
  },
  {
    role: "user",
    content: `QA List: ${JSON.stringify(qaList)}`
  }
];