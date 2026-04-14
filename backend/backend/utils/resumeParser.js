const axios = require('axios');
const fs = require('fs');
const pdfParseModule = require('pdf-parse');

async function parsePdfBuffer(buffer) {
  if (typeof pdfParseModule === 'function') {
    const data = await pdfParseModule(buffer);
    return data?.text || '';
  }

  if (pdfParseModule && typeof pdfParseModule.PDFParse === 'function') {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result?.text || '';
    } finally {
      await parser.destroy();
    }
  }

  throw new Error('Unsupported pdf-parse module format');
}

async function extractResumeText(filePathOrUrl) {
  if (!filePathOrUrl) throw new Error('Resume file path is required');

  const isUrl = /^https?:\/\//i.test(filePathOrUrl);
  if (isUrl) {
    const response = await axios.get(filePathOrUrl, { responseType: 'arraybuffer', timeout: 30000 });
    return parsePdfBuffer(response.data);
  }

  const buffer = await fs.promises.readFile(filePathOrUrl);
  return parsePdfBuffer(buffer);
}

module.exports = { extractResumeText };
