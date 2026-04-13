import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyCandidate } from "../../services/interviewApi";

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Candidate verification failed. Please try again.";
}

export default function VerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email address is required.");
      return;
    }

    if (!token) {
      setError("Interview token is missing. Please use a valid verification link.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await verifyCandidate(normalizedEmail, token);
      navigate(`/interview/instructions/${token}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="card verification-card">
        <div className="hero-copy">
          <p className="eyebrow">Step 1</p>
          <h1>Candidate Verification</h1>
          <p className="muted">
            Please provide your registered email address to authenticate and access the interview session.
          </p>
        </div>

        <form className="verification-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Email address</span>
            <input
              className="text-input"
              type="email"
              name="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Start Interview"}
          </button>
        </form>
      </section>
    </main>
  );
}
