import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const RULES = {
  BEFORE: [
    "Find a quiet, well-lit room free from background noise.",
    "Ensure you have a highly stable internet connection.",
    "Place your camera at eye level for better engagement."
  ],
  DURING: [
    "Do not switch tabs or open other applications.",
    "Keep your face clearly visible in the camera at all times.",
    "Using mobile phones or having others present is forbidden."
  ],
  AFTER: [
    "Wait for the 'Submission Successful' message before closing.",
    "Ensure you complete the session in one continuous attempt."
  ]
};

export default function PrerequisitesPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const videoRef = useRef(null);

  const [checks, setChecks] = useState({
    camera: false,
    mic: false,
    screen: false
  });
  const [streams, setStreams] = useState({
    webcam: null,
    screen: null
  });
  const [isCapturing, setIsCapturing] = useState(false);

  // 1. Camera & Mic Check
  const startHardwareCheck = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setChecks(prev => ({ ...prev, camera: true, mic: true }));
      setStreams(prev => ({ ...prev, webcam: stream }));
    } catch (err) {
      alert("Camera or Microphone access denied. Please enable them to proceed.");
    }
    setIsCapturing(false);
  };

  // 2. Screen Share Check
  const startScreenCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setChecks(prev => ({ ...prev, screen: true }));
      setStreams(prev => ({ ...prev, screen: stream }));
      // Stop the stream immediately after check to save resources; we re-capture in interview
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      alert("Screen sharing is mandatory for proctoring. Please allow it.");
    }
  };

  const handleStart = () => {
    // Ensure all streams are stopped before navigation
    streams.webcam?.getTracks().forEach(t => t.stop());
    streams.screen?.getTracks().forEach(t => t.stop());
    navigate(`/interview/${token}`);
  };

  const allPassed = checks.camera && checks.mic && checks.screen;

  return (
    <main className="page-shell" style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <p className="eyebrow" style={{ color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Preparation Phase</p>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem' }}>System Check & Instructions</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        {/* Left: Hardware Check */}
        <section className="card" style={{ padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛠️ Hardware Verification
          </h2>
          
          <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '1.5rem', position: 'relative' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {!checks.camera && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                Camera Preview Off
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: checks.camera && checks.mic ? '#f0fdf4' : '#f8fafc', borderRadius: '12px' }}>
              <span>Webcam & Microphone</span>
              {checks.camera ? <span style={{ color: '#22c55e' }}>✅ Verified</span> : <button onClick={startHardwareCheck} className="secondary-button" disabled={isCapturing}>Allow Access</button>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: checks.screen ? '#f0fdf4' : '#f8fafc', borderRadius: '12px' }}>
              <span>Screen Sharing</span>
              {checks.screen ? <span style={{ color: '#22c55e' }}>✅ Verified</span> : <button onClick={startScreenCheck} className="secondary-button">Test Screen Share</button>}
            </div>
          </div>
        </section>

        {/* Right: Instructions */}
        <section>
          <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: '#f8fafc' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>📜 Interview Rules</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#4f46e5', marginBottom: '0.5rem' }}>Step 1: Before Starting</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#475569' }}>
                {RULES.BEFORE.map((r, i) => <li key={i} style={{ marginBottom: '0.4rem' }}>{r}</li>)}
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#4f46e5', marginBottom: '0.5rem' }}>Step 2: During Interview</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#475569' }}>
                {RULES.DURING.map((r, i) => <li key={i} style={{ marginBottom: '0.4rem' }}>{r}</li>)}
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#4f46e5', marginBottom: '0.5rem' }}>Step 3: Completion</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#475569' }}>
                {RULES.AFTER.map((r, i) => <li key={i} style={{ marginBottom: '0.4rem' }}>{r}</li>)}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              onClick={handleStart} 
              className="primary-button" 
              disabled={!allPassed}
              style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '16px', opacity: allPassed ? 1 : 0.5 }}
            >
              {allPassed ? "All Systems Ready - Start Interview" : "Complete Hardware Checks to Proceed"}
            </button>
            <p className="muted" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              By clicking start, you agree to our AI proctoring policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
