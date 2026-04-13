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
            <h1>Interview Successfully Submited</h1>
            <p className="muted">
              Your video session and technical responses have been securely preserved.
            </p>
          </div>
        </div>

        <section className="result-summary-box" style={{ textAlign: "center", padding: "3rem 1rem", border: "1px dashed var(--border-color)", borderRadius: "12px" }}>
          <h2 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>Evaluation Sent to Manager</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
            Thank you for completing the AI-Assisted Interview Protocol. Your profile, proctoring metrics, 
            and skill evaluations have been accurately compiled and safely delivered to the recruiting panel. <br/><br/>
            You may now safely close this window. Our Human Resources department will get in touch with you 
            shortly regarding your application timeline.
          </p>
        </section>

        <div className="result-actions" style={{ justifyContent: "center" }}>
          <button className="primary-button" type="button" onClick={() => window.location.href = "https://www.google.com"}>
            Close & Exit Portal
          </button>
        </div>
      </section>
    </main>
  );
}
