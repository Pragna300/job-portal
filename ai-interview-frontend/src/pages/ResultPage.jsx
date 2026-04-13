import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const INTERVIEW_RESULT_STORAGE_KEY = "ai-interview-result";

const EMPTY_RESULT = {
  token: "",
  score: 0,
  summary: "Assessment results are pending.",
  strengths: [],
  weaknesses: [],
  answers: [],
};

export default function ResultPage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();
  const [result, setResult] = useState(EMPTY_RESULT);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(INTERVIEW_RESULT_STORAGE_KEY);

    if (!storedValue) {
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue);

      if (parsedValue?.token === token) {
        setResult(parsedValue);
      }
    } catch {
      setResult(EMPTY_RESULT);
    }
  }, [token]);

  const hasResult = result.score > 0;

  return (
    <main className="page-shell result-shell">
      <section className="card result-card">
        <div className="result-header">
          <div>
            <p className="eyebrow">Step 3</p>
            <h1>Interview Result</h1>
            <p className="muted">
              {hasResult
                ? "Assessment summary based on candidate responses."
                : "Awaiting interview completion to generate assessment."}
            </p>
          </div>
          <div className="score-badge">
            <span className="score-label">Score</span>
            <strong>{result.score || "--"}</strong>
          </div>
        </div>

        <section className="result-summary-box">
          <h2>Summary</h2>
          <p>{result.summary}</p>
        </section>

        <section className="result-grid">
          <article className="result-panel">
            <h2>Strengths</h2>
            {result.strengths.length ? (
              <ul className="result-list">
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No strengths data available.</p>
            )}
          </article>

          <article className="result-panel">
            <h2>Weaknesses</h2>
            {result.weaknesses.length ? (
              <ul className="result-list">
                {result.weaknesses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No weaknesses data available.</p>
            )}
          </article>
        </section>

        <section className="result-panel answer-review-panel">
          <div className="result-header-inline">
            <h2>Answer Review</h2>
            <span className="token-chip result-token-chip">Session: {token}</span>
          </div>
          {result.answers.length ? (
            <div className="answer-review-list">
              {result.answers.map((entry) => (
                <article className="answer-review-item" key={entry.question}>
                  <h3>{entry.question}</h3>
                  <p>{entry.answer}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No response data found for this session.</p>
          )}
        </section>

        <div className="result-actions">
          <button className="secondary-button" type="button" onClick={() => navigate("/")}>
            Back To Start
          </button>
          <Link className="primary-button result-link-button" to={`/interview/${token}`}>
            Reopen Interview
          </Link>
        </div>
      </section>
    </main>
  );
}
