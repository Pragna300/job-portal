import { useNavigate, useParams } from "react-router-dom";

const INSTRUCTIONS = {
  BEFORE: [
    "Find a quiet, well-lit private space.",
    "Ensure your internet connection is stable (high-speed recommended).",
    "Have your webcam and microphone ready for verification."
  ],
  DURING: [
    "Keep your focus on the screen; do not look away for long periods.",
    "Switching tabs or opening other applications will trigger disqualification warnings.",
    "The use of mobile phones or external assistance is strictly prohibited."
  ],
  AFTER: [
    "Wait for the final success message before closing the window.",
    "Your evaluation results will be delivered directly to the hiring manager."
  ]
};

export default function InstructionsPage() {
  const navigate = useNavigate();
  const { token } = useParams();

  const handleAllowAndContinue = () => {
    navigate(`/system-check/${token}`);
  };

  return (
    <main className="page-shell" style={{ maxWidth: '850px', margin: '0 auto', padding: '4rem 2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <p className="eyebrow" style={{ color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>Step 1 of 4</p>
        <h1 style={{ fontSize: '2.75rem', fontWeight: '800', marginTop: '0.5rem', color: '#0f172a' }}>Interview Instructions</h1>
        <p style={{ color: '#64748b', fontSize: '1.2rem', marginTop: '1rem' }}>Please review the rules carefully before proceeding to system verification.</p>
      </header>

      <section className="instructions-container" style={{ display: 'grid', gap: '2rem' }}>
        <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem' }}>
            <div>
              <h3 style={{ color: '#4f46e5', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏠 Preparation</h3>
              <ul style={{ paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.8' }}>
                {INSTRUCTIONS.BEFORE.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#4f46e5', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🚫 Proctoring Rules</h3>
              <ul style={{ paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.8' }}>
                {INSTRUCTIONS.DURING.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: '16px', padding: '1.5rem', color: '#991b1b' }}>
          <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
            <strong>Important:</strong> Our AI monitoring system is highly sensitive. Repeated violations (detected phones, multiple faces, or tab switching) will result in automatic disqualification after 3 warnings.
          </p>
        </div>
      </section>

      <footer style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button 
          onClick={handleAllowAndContinue} 
          className="primary-button" 
          style={{ padding: '1.2rem 4rem', fontSize: '1.1rem', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
        >
          I Understand & Allow
        </button>
        <p style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          Next Step: Webcam, Voice, and Screen Verification
        </p>
      </footer>
    </main>
  );
}
