import { Link } from "react-router-dom";

export default function CompletionPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center', background: 'white', padding: '3.5rem', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>Interview Completed</h1>
        <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          Your responses and proctoring summary have been <strong>successfully sent to the hiring manager</strong>. Our team will review your application and get back to you via email.
        </p>
        
        <div style={{ padding: '1.5rem', background: '#f0f9ff', borderRadius: '16px', marginBottom: '2.5rem', textAlign: 'left' }}>
          <p style={{ color: '#0369a1', fontSize: '0.9rem', margin: 0 }}>
            <strong>What's Next?</strong><br/>
            You can now safely close this browser window. Your session has been finalized and the interview link is now inactive.
          </p>
        </div>

        <button 
          onClick={() => window.close()} 
          className="secondary-button"
          style={{ padding: '1rem 2.5rem', fontWeight: 'bold' }}
        >
          Close Portal
        </button>

        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Technical issues? Contact <a href="mailto:support@shnoor.com" style={{ color: '#6366f1' }}>support@shnoor.com</a>
        </p>
      </div>
    </main>
  );
}
