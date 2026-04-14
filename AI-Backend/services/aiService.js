const axios = require("axios");

/**
 * callAI — sends messages to OpenRouter using the standard OpenAI-compatible REST API.
 * Uses axios directly to avoid SDK version compatibility issues.
 *
 * @param {Array} messages  — Array of { role, content } message objects
 * @returns {string}        — The AI response text
 */
const callAI = async (messages) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8080",
          "X-Title": "AI Interview Portal",
        },
        timeout: 60000, // 60s timeout for AI calls
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI returned an empty response.");
    }
    return content;
  } catch (err) {
    // Distinguish between API errors and network errors for better logging
    if (err.response) {
      console.error("AI API Error:", err.response.status, JSON.stringify(err.response.data));
      throw new Error(`AI API error ${err.response.status}: ${err.response.data?.error?.message ?? "Unknown"}`);
    } else {
      console.error("AI Network/Timeout Error:", err.message);
      throw new Error("AI request failed: " + err.message);
    }
  }
};

module.exports = { callAI };