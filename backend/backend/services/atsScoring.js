function normalize(value) {
  return String(value || '').toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholeTerm(text, term) {
  const pattern = escapeRegex(normalize(term)).replace(/\s+/g, '\\s+');
  const regex = new RegExp(`(^|[^a-z0-9+#.])${pattern}($|[^a-z0-9+#.])`, 'i');
  return regex.test(text);
}

function includesAny(haystackItems, needles) {
  const text = haystackItems.map(normalize).join(' ');
  return needles.some((needle) => containsWholeTerm(text, needle));
}

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'all', 'and', 'any', 'are', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'cannot', 'could', 'couldn', 'did', 'didn', 'does', 'doesn', 'doing', 'down', 'during', 'each', 'from', 'further', 'had', 'hadn', 'has', 'hasn', 'have', 'haven', 'having', 'here', 'hers', 'herself', 'himself', 'into', 'itself', 'more', 'most', 'mustn', 'myself', 'only', 'other', 'ought', 'ours', 'ourselves', 'over', 'same', 'shan', 'should', 'shouldn', 'some', 'such', 'than', 'that', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'under', 'until', 'very', 'wasn', 'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'whom', 'with', 'would', 'wouldn', 'your', 'yours', 'yourself', 'yourselves', 
  'opportunity', 'employer', 'benefits', 'dental', 'health', 'vision', '401k', 'paid', 'time', 'pto', 'equal', 'status', 'race', 'color', 'religion', 'sexual', 'orientation', 'gender', 'identity', 'national', 'origin', 'veteran', 'disability', 'apply', 'please', 'resume', 'company', 'looking', 'years', 'required', 'preferred', 'must', 'have', 'will', 'make', 'join', 'team', 'work', 'job', 'position', 'role', 'ideal', 'candidate', 'strong', 'excellent', 'good', 'skills', 'experience', 'working', 'ability', 'able', 'knowledge', 'understanding', 'support', 'business', 'building', 'develop', 'development', 'design', 'engineering', 'manage', 'managing', 'management', 'ensure', 'ensuring', 'provide', 'providing', 'including', 'included', 'include'
]);

function scoreResumeEntities(parsedEntities, resumeText = '', jobDescription = '', jobTitle = '') {
  const descRaw = String(jobDescription).toLowerCase();
  const titleRaw = String(jobTitle).toLowerCase();
  const textRaw = String(resumeText).toLowerCase();

  const jobWords = descRaw.match(/\b[a-z]{4,}\b/g) || [];
  const validJobWords = [...new Set(jobWords.filter(w => !STOP_WORDS.has(w)))];

  const resumeWords = textRaw.match(/\b[a-z]{4,}\b/g) || [];
  const resumeWordSet = new Set(resumeWords);

  let score = 0;
  
  if (validJobWords.length > 0) {
    let matchCount = 0;
    validJobWords.forEach(word => {
      if (resumeWordSet.has(word)) matchCount++;
    });
    
    // Genuine textual semantic overlap
    const matchRatio = matchCount / validJobWords.length;
    
    // 25% overlap of purely specific job words is statistically strong enough now.
    const textScore = (matchRatio / 0.25) * 60; 
    score += Math.min(60, textScore);
  } else {
    // Fallback if description is empty
    score += 30;
  }

  // Structured Bonuses
  const skills = Array.isArray(parsedEntities?.skills) ? parsedEntities.skills : [];
  const education = Array.isArray(parsedEntities?.education) ? parsedEntities.education : [];
  const experience = Array.isArray(parsedEntities?.experience) ? parsedEntities.experience : [];

  if (education.length > 0 || resumeWordSet.has('university') || resumeWordSet.has('college') || resumeWordSet.has('bachelor')) {
    score += 10;
  }
  
  const hasExpIndicators = experience.length > 0 || resumeWordSet.has('project') || resumeWordSet.has('intern');
  if (hasExpIndicators) {
    score += 15;
  }
  
  // Job Title keyword match
  const titleWords = titleRaw.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
  if (titleWords.length > 0) {
      const matchedTitleWords = titleWords.filter(w => resumeWordSet.has(w)).length;
      score += (matchedTitleWords / titleWords.length) * 15;
  }

  // Moderate penalization if they clearly don't match Senior requirements
  if (titleRaw.includes('senior') || titleRaw.includes('lead') || titleRaw.includes('manager')) {
      if (!resumeWordSet.has('lead') && !resumeWordSet.has('senior') && !resumeWordSet.has('management') && !resumeWordSet.has('architect')) {
        score -= 10; 
      }
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { scoreResumeEntities };
