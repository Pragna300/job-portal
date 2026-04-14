import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function InstructionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams();

  const handleStart = () => {
    navigate(`/interview/${token}`, { state: location.state });
  };

  return (
    <main className="page-shell">
      <section className="card verification-card" style={{ maxWidth: '800px' }}>
        <div className="hero-copy">
          <p className="eyebrow">Step 2</p>
          <h1>Interview Instructions</h1>
          <p className="muted">
            Please read the following instructions carefully before starting your proctored interview.
          </p>
        </div>

        <div className="instructions-content" style={{ textAlign: 'left', margin: '2rem 0', lineHeight: '1.6' }}>
          <h3>Proctoring Rules</h3>
          <ul>
            <li><strong>Camera & Microphone Required:</strong> Your webcam and microphone must be active throughout the entire session.</li>
            <li><strong>Screen Sharing Required:</strong> You will be prompted to share your screen. If you stop sharing, the session may be flagged.</li>
            <li><strong>Do Not Switch Tabs:</strong> Navigating away from the interview tab is strictly prohibited and will reduce your integrity score.</li>
            <li><strong>Stay In Frame:</strong> Ensure your face is clearly visible in the camera at all times. Multiple faces in the frame will trigger a violation.</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Warning System</h3>
          <p>
            The session is actively monitored by an Administrator. If an administrator detects malicious activity, they may issue a warning. 
            <strong> Receiving 3 warnings will result in immediate auto-termination of your interview.</strong>
          </p>
        </div>

        <button className="primary-button" onClick={handleStart}>
          I Understand, Start Interview
        </button>
      </section>
    </main>
  );
}
