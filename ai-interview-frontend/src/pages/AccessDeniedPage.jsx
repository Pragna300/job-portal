import { Link } from "react-router-dom";

export default function AccessDeniedPage({ reason = "ALREADY_COMPLETED" }) {
  const isExpired = reason === "EXPIRED";
  
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid #fee2e2' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔒</div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#991b1b', marginBottom: '1rem' }}>
          {isExpired ? "Link Expired" : "Access Denied"}
        </h1>
        <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '2rem' }}>
          {isExpired 
            ? "Your interview invitation has expired. Most links are valid for 24 hours from issuance." 
            : "This interview session has already been completed or the link has been invalidated. Each invitation is strictly for personal, one-time use."}
        </p>
        
        <div style={{ padding: '1.25rem', background: '#fff1f2', borderRadius: '12px', marginBottom: '2rem' }}>
          <p style={{ color: '#be123c', fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>
            Reference: {isExpired ? "TOKEN_EXPIRED_24H" : "SINGLE_USE_POLICY_VIOLATION"}
          </p>
        </div>

        <Link to="/" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 'bold' }}>
          Return to Portal Home
        </Link>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          If you believe this is an error, please reach out to your recruiter or contact <a href="mailto:support@shnoor.com" style={{ color: '#6366f1' }}>support@shnoor.com</a>.
        </p>
      </div>
    </main>
  );
}
