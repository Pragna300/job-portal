import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, User } from "lucide-react";

export default function SessionSummaryReport() {
  const { candidateId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(`/api/proctoring/session-summary/${candidateId}`);
        setData(res.data);
      } catch (err) {
        console.error("Fetch Summary Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [candidateId]);

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Generating report...</div>;
  if (!data) return <div style={{ padding: '5rem', textAlign: 'center' }}>Report not found.</div>;

  const getStatusColor = (status) => {
    if (status === 'COMPLETED') return '#2f855a';
    if (status === 'TERMINATED') return '#c53030';
    return '#2d3748';
  };

  return (
    <div className="report-shell" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Interview & Proctoring Summary</h1>
          <p className="muted">Detailed candidate assessment and integrity audit</p>
        </div>
        <div style={{ textAlign: 'end' }}>
          <span style={{ 
            padding: '0.5rem 1rem', borderRadius: '8px', 
            background: getStatusColor(data.status), color: 'white', fontWeight: 'bold' 
          }}>
            {data.status}
          </span>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{new Date(data.created_at).toLocaleString()}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Column: Stats & Metadata */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p className="muted" style={{ marginBottom: '0.5rem' }}><User size={14} style={{ marginRight: '5px' }} /> Candidate</p>
            <h3 style={{ margin: 0 }}>{data.candidate_name}</h3>
          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p className="muted" style={{ marginBottom: '0.5rem' }}><Shield size={14} style={{ marginRight: '5px' }} /> Integrity Score</p>
            <h2 style={{ margin: 0, color: data.integrity_score > 70 ? '#2f855a' : '#c53030' }}>{data.integrity_score}%</h2>
          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p className="muted" style={{ marginBottom: '0.5rem' }}><AlertTriangle size={14} style={{ marginRight: '5px' }} /> Violations</p>
            <h3 style={{ margin: 0 }}>{data.violation_count} Total</h3>
          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p className="muted" style={{ marginBottom: '0.5rem' }}><Clock size={14} style={{ marginRight: '5px' }} /> Duration</p>
            <h3 style={{ margin: 0 }}>{Math.floor((new Date(data.end_time || Date.now()) - new Date(data.start_time))/60000)} mins</h3>
          </div>
        </aside>

        {/* Right Column: AI Summary & Logs */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#2d3748' }}>
              <FileText color="#4299e1" /> AI Conclusion & Summary
            </h2>
            <div style={{ lineHeight: '1.8', color: '#4a5568', whiteSpace: 'pre-wrap' }}>
              {data.session_summary || "Analyzing interview performance and proctoring data... AI Summary will be generated shortly."}
            </div>
          </section>

          <section>
            <h2 style={{ marginBottom: '1rem' }}>Violation Timeline</h2>
            {data.violations && data.violations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.violations.map((v, i) => (
                  <div key={i} style={{ 
                    padding: '1rem', background: '#fffaf0', borderLeft: '4px solid #ecc94b', 
                    borderRadius: '4px', display: 'flex', justifyContent: 'space-between'
                  }}>
                    <div>
                      <strong style={{ display: 'block' }}>{v.violation_type}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#718096' }}>{new Date(v.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span style={{ color: '#c05621', fontWeight: 'bold' }}>-{v.integrity_reduction}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#f0fff4', borderRadius: '12px', color: '#2f855a', border: '1px solid #c6f6d5' }}>
                <CheckCircle size={32} style={{ marginBottom: '0.5rem' }} />
                <p>Clean Session: No violations detected.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
