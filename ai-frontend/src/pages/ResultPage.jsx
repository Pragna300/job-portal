import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ResultPage() {
  const navigate = useNavigate();

  return (
    <main className="page-shell result-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <section className="card result-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <CheckCircle size={64} color="#4CAF50" />
        </div>
        
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#1f2937', fontWeight: '700' }}>
          Thank You for Attending the Interview
        </h1>
        
        <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '500px' }}>
          Your interview has been successfully completed. We appreciate your time and participation. Our team will review your responses and update you about your progress soon.
        </p>
        
        <button 
          className="primary-button" 
          type="button" 
          onClick={() => navigate("/")}
          style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}
        >
          Back to Home
        </button>
      </section>
    </main>
  );
}
