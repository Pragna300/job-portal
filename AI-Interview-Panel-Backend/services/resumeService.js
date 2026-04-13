const axios = require("axios");
const pdfParse = require("pdf-parse");

const extractResumeText = async (url) => {
  try {
    console.log("Fetching Resume URL:", url);

    const res = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const data = await pdfParse(res.data);
    const text = data.text || "";

    console.log("Extracted text length:", text.length);

    if (text.length < 50) {
      console.warn("Extracted text is very short. Might be a scanned image.");
    }

    return text;
  } catch (err) {
    console.error("Resume Parse Error (pdf-parse):", err.message);
    throw new Error("Failed to parse resume content from URL");
  }
};

module.exports = { extractResumeText };