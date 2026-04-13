import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function InstructionsPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [accepted, setAccepted] = useState(false);

  const handleStart = () => {
    if (accepted) {
      navigate(`/interview/setup/${token}`);
    }
  };

  return (
    <main className="page-shell">
      <section className="card instructions-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <p className="eyebrow">Step 2</p>
        <h1>Live AI Proctoring Protocol</h1>
        
        <div className="instructions-content" style={{ textAlign: 'left', margin: '2rem 0', lineHeight: '1.6' }}>
          <p>By proceeding, you agree to comply with our AI-driven proctoring standards:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
            <li><strong>Dual Stream Surveillance:</strong> We will capture both your Webcam and your Full Screen.</li>
            <li><strong>AI Facial Monitor:</strong> Turning off the camera or moving out of frame will trigger a violation.</li>
            <li><strong>Environmental Policy:</strong> Multiple faces or voices in the room are prohibited.</li>
            <li><strong>Focus Retention:</strong> Switching browser tabs or windows will deduct 10 points from your integrity score.</li>
            <li><strong>Termination Policy:</strong> Accruing 3 warnings results in immediate disqualification.</li>
          </ul>
          
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2' }}>
            <p style={{ color: '#c53030', fontWeight: 'bold' }}>Important Readiness Check:</p>
            <p>Ensure your environment is quiet and well-lit. You will be prompted to grant permissions for "Camera" and "Screen Recording" on the next page.</p>
          </div>
        </div>

        <div className="acceptance-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <input 
            type="checkbox" 
            id="accept-rules" 
            checked={accepted} 
            onChange={(e) => setAccepted(e.target.checked)} 
            style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
          />
          <label htmlFor="accept-rules" style={{ cursor: 'pointer', fontWeight: '500' }}>
            I understand and consent to the recording of my webcam and screen for evaluation purposes.
          </label>
        </div>

        <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className="secondary-button" 
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button 
            className="primary-button" 
            disabled={!accepted}
            onClick={handleStart}
            style={{ padding: '0.75rem 2rem' }}
          >
            I am Ready to Start
          </button>
        </div>
      </section>
    </main>
  );
}
