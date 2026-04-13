import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SystemCheckPage() {
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

  const startHardwareCheck = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setChecks(prev => ({ ...prev, camera: true, mic: true }));
      setStreams(prev => ({ ...prev, webcam: stream }));
    } catch (err) {
      alert("Hardware access denied. Please enable your camera and microphone in browser settings.");
    }
    setIsCapturing(false);
  };

  const startScreenCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setChecks(prev => ({ ...prev, screen: true }));
      setStreams(prev => ({ ...prev, screen: stream }));
      // Stop screen stream instantly; we re-capture in the interview
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      alert("Screen sharing is mandatory. Please select a screen to share.");
    }
  };

  const handleStartInterview = () => {
    // Stop webcam test stream
    streams.webcam?.getTracks().forEach(t => t.stop());
    navigate(`/interview/${token}`);
  };

  const allPassed = checks.camera && checks.mic && checks.screen;

  return (
    <main className="page-shell" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <p className="eyebrow" style={{ color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>Step 2 of 4</p>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem' }}>System Verification</h1>
        <p style={{ color: '#64748b', marginTop: '0.75rem' }}>Verifying your hardware and permissions for a secure session.</p>
      </header>

      <section className="check-grid" style={{ display: 'grid', gap: '2rem' }}>
        <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '2rem', position: 'relative' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {!checks.camera && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                Camera feed will appear here
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: checks.camera ? '#f0fdf4' : '#f8fafc', borderRadius: '16px', border: checks.camera ? '1px solid #bcf0da' : '1px solid #e2e8f0' }}>
              <div>
                <h4 style={{ margin: 0, color: '#1e293b' }}>Webcam & Voice</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Video and audio input check</p>
              </div>
              {checks.camera ? (
                <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ ACTIVE</span>
              ) : (
                <button onClick={startHardwareCheck} className="secondary-button" disabled={isCapturing} style={{ padding: '0.5rem 1.25rem' }}>Enable</button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: checks.screen ? '#f0fdf4' : '#f8fafc', borderRadius: '16px', border: checks.screen ? '1px solid #bcf0da' : '1px solid #e2e8f0' }}>
              <div>
                <h4 style={{ margin: 0, color: '#1e293b' }}>Screen Sharing</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Authorization for proctoring</p>
              </div>
              {checks.screen ? (
                <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ AUTHORIZED</span>
              ) : (
                <button onClick={startScreenCheck} className="secondary-button" style={{ padding: '0.5rem 1.25rem' }}>Verify</button>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={handleStartInterview} 
            className="primary-button" 
            disabled={!allPassed}
            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '50px', fontWeight: 'bold', opacity: allPassed ? 1 : 0.4 }}
          >
            {allPassed ? "Step 3: Begin Interview" : "Please Complete All Checks"}
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            By clicking Begin, you start your single-use interview attempt.
          </p>
        </div>
      </section>
    </main>
  );
}
