const axios = require('axios');

const HF_MODEL_URL = 'https://api-inference.huggingface.co/models/AventIQ-AI/Resume-Parsing-NER-AI-Model';
const SKILL_KEYWORDS = [
  'python', 'sql', 'mysql', 'postgresql', 'postgres', 'mongodb',
  'java', 'javascript', 'typescript', 'react', 'node', 'express',
  'aws', 'docker', 'kubernetes', 'git', 'tensorflow', 'pytorch'
];
const EDUCATION_KEYWORDS = [
  'b.tech', 'btech', 'm.tech', 'mtech', 'b.e', 'be', 'bsc', 'msc',
  'bachelor', 'master', 'degree', 'university', 'college'
];

function cleanToken(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeSkill(value) {
  return cleanToken(value).toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildEntitiesFromResponse(payload) {
  const entities = {
    name: '',
    email: '',
    skills: [],
    education: [],
    experience: []
  };

  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.[0]) ? payload[0] : [];
  if (!rows.length) return entities;

  for (const row of rows) {
    const label = String(row?.entity_group || row?.entity || '').toUpperCase();
    const word = cleanToken(row?.word || row?.text || row?.token || '');
    if (!word) continue;

    if (!entities.name && (label.includes('NAME') || label.includes('PERSON'))) {
      entities.name = word;
      continue;
    }
    if (!entities.email && (label.includes('EMAIL') || /@/.test(word))) {
      entities.email = word;
      continue;
    }
    if (label.includes('SKILL')) {
      entities.skills.push(word);
      continue;
    }
    if (label.includes('EDU') || label.includes('DEGREE') || label.includes('COLLEGE') || label.includes('UNIVERSITY')) {
      entities.education.push(word);
      continue;
    }
    if (label.includes('EXP') || label.includes('WORK') || label.includes('PROJECT')) {
      entities.experience.push(word);
    }
  }

  entities.skills = [...new Set(entities.skills.map(normalizeSkill).filter(Boolean))];
  entities.education = [...new Set(entities.education.map(cleanToken).filter(Boolean))];
  entities.experience = [...new Set(entities.experience.map(cleanToken).filter(Boolean))];
  return entities;
}

function fallbackExtractEntitiesFromText(resumeText) {
  const text = String(resumeText || '');
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).map((line) => cleanToken(line)).filter(Boolean);

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig);
  const skills = SKILL_KEYWORDS.filter((skill) => lower.includes(skill)).map((skill) => skill.toLowerCase());
  const education = lines.filter((line) =>
    EDUCATION_KEYWORDS.some((keyword) => line.toLowerCase().includes(keyword))
  ).slice(0, 8);
  const experience = lines.filter((line) =>
    /\b(experience|intern|developer|engineer|project|worked|employment)\b/i.test(line)
  ).slice(0, 12);

  // Heuristic name: first non-empty short line that is not contact/link text.
  const candidateName = lines.find((line) =>
    line.length >= 3 &&
    line.length <= 40 &&
    !/@|http|www|linkedin|github|phone|mobile/i.test(line)
  ) || '';

  return {
    name: candidateName,
    email: emailMatch?.[0] || '',
    skills: [...new Set(skills)],
    education: [...new Set(education)],
    experience: [...new Set(experience)]
  };
}

async function extractResumeEntities(resumeText) {
  const hfApiKey = (process.env.HF_API_KEY || '').trim();
  if (!hfApiKey) throw new Error('HF_API_KEY is not configured');
  if (!resumeText || !resumeText.trim()) throw new Error('Resume text is empty');

  const payload = { inputs: resumeText.slice(0, 12000) };
  const config = {
    headers: {
      Authorization: `Bearer ${hfApiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await axios.post(HF_MODEL_URL, payload, config);
      return buildEntitiesFromResponse(response.data);
    } catch (error) {
      const status = error?.response?.status;
      const errorText = String(error?.response?.data?.error || '');
      const isModelLoading = status === 503 || /loading/i.test(errorText);
      if (attempt < 2 && isModelLoading) {
        await sleep(1200);
        continue;
      }
      // Model may be unavailable (e.g. 410/404/rate-limit). Fallback to local extraction.
      return fallbackExtractEntitiesFromText(resumeText);
    }
  }

  return fallbackExtractEntitiesFromText(resumeText);
}

module.exports = { extractResumeEntities };
