const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

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
  const source = payload?.evaluation ?? payload?.data ?? payload;
  const score = source?.overall_score ?? source?.score ?? source?.result?.score ?? 0;
  const summary = source?.summary ?? source?.result?.summary ?? "";
  const strengths = normalizeStringList(
    source?.strengths ?? source?.result?.strengths
  );
  const weaknesses = normalizeStringList(
    source?.weaknesses ?? source?.result?.weaknesses
  );

  return {
    token: source?.token ?? payload?.token ?? "",
    score,
    summary,
    strengths,
    weaknesses,
    answers: fallbackAnswers,
  };
}

export async function verifyCandidate(token, email) {
  const response = await fetch(getApiUrl("/api/interview/verify-user"), {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify({ token, email }),
  });

  const payload = await parseJsonResponse(response);
  return extractToken(payload);
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
