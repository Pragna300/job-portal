const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getJsonHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        payload?.error ??
        `Request failed with status ${response.status}.`
    );
  }

  return payload;
}

function extractToken(payload) {
  const token =
    payload?.token ??
    payload?.data?.token ??
    payload?.interviewToken ??
    payload?.data?.interviewToken;

  if (!token) {
    throw new Error("Authentication successful, but session token is missing.");
  }

  return token;
}

function extractQuestions(payload) {
  const questions =
    payload?.questions ??
    payload?.data?.questions ??
    payload?.data ??
    payload;

  if (!Array.isArray(questions) || !questions.length) {
    throw new Error("No assessment questions found for the provided session.");
  }

  return questions.map((entry) => {
    if (typeof entry === "string") {
      return entry;
    }

    return entry?.question ?? entry?.text ?? "";
  }).filter(Boolean);
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim());
}

function extractResult(payload, fallbackAnswers) {
  const source = payload?.data ?? payload;
  const evalData = source?.evaluation ?? source?.result ?? source;
  
  const score = evalData?.overall_score ?? evalData?.score ?? 0;
  const summary = evalData?.summary ?? "";
  const strengths = normalizeStringList(evalData?.strengths);
  const weaknesses = normalizeStringList(evalData?.weaknesses);

  return {
    token: source?.token ?? payload?.token ?? "",
    score,
    summary,
    strengths,
    weaknesses,
    answers: fallbackAnswers,
  };
}

export async function verifyCandidate(email) {
  const response = await fetch(getApiUrl("/api/interview/verify-user"), {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify({ email }),
  });

  const payload = await parseJsonResponse(response);
  
  // DIAGNOSTIC ALERT: This helps find where the ID is hidden in the real response
  if (!payload?.userId && !payload?.user_id && !payload?.data?.userId && !payload?.data?.user_id) {
    alert("DIAGNOSTIC: Payload received but ID missing.\nPayload keys: " + Object.keys(payload || {}).join(", ") + 
          "\nFull Payload: " + JSON.stringify(payload));
  }

  const token = extractToken(payload);
  const dataLayer = payload?.data ?? payload;
  
  // Search for ID in any common format
  const userId = 
    dataLayer?.userId ?? 
    dataLayer?.user_id ?? 
    dataLayer?.id ?? 
    dataLayer?.candidateId;

  return {
    token,
    userId
  };
}

export async function getInterviewQuestions(token) {
  const response = await fetch(
    getApiUrl(`/api/interview/questions/${encodeURIComponent(token)}`),
    {
      method: "GET",
      headers: getJsonHeaders(),
    }
  );

  const payload = await parseJsonResponse(response);
  return extractQuestions(payload);
}

export async function submitInterview(token, answers) {
  const validAnswers = answers.filter((entry) => entry?.question && entry?.answer);
  const response = await fetch(getApiUrl("/api/interview/submit"), {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify({
      token,
      answers: validAnswers,
    }),
  });

  const payload = await parseJsonResponse(response);
  return extractResult(payload, validAnswers);
}
