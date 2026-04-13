const safeJsonParse = (text) => {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Invalid JSON from AI:", text);
    return null;
  }
};

module.exports = safeJsonParse;