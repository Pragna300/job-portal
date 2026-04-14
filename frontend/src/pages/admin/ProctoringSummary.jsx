import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";

export default function ProctoringSummary() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/api/proctoring/session-summary/${id}`);
        setReport(data);
      } catch (error) {
        console.error("Error fetching report", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <div>Loading Report...</div>;
  if (!report) return <div>No report found for this candidate session.</div>;

  return (
    <div className="admin-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="text-2xl font-bold">Comprehensive Session Report</h1>
        <Link to="/admin/proctoring" style={{ padding: '8px 16px', background: '#f5f5f5', borderRadius: '4px', textDecoration: 'none', color: '#333', border: '1px solid #ccc' }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        
        {/* Header Summary */}
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0' }}>{report.candidateName}</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span style={{ 
              padding: '4px 12px', 
              borderRadius: '20px', 
              color: 'white', 
              fontWeight: 'bold',
              background: report.status === 'COMPLETED' ? '#4caf50' : report.status === 'TERMINATED' ? '#f44336' : '#2196f3' 
            }}>
              {report.status}
            </span>
            <span style={{ padding: '4px 0', color: '#666' }}>
              Final Integrity: <strong style={{ color: report.integrityScore < 70 ? '#d32f2f' : '#2e7d32' }}>{report.integrityScore}%</strong>
            </span>
          </div>
        </div>

        {/* Proctoring Data */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ borderBottom: '2px solid #1976d2', paddingBottom: '8px', display: 'inline-block' }}>Proctoring & Integrity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px' }}>
              <p><strong>Total Warnings Sent:</strong> {report.warningsCount} (Max 3)</p>
              <p><strong>Total Violations Logged:</strong> {report.totalViolations}</p>
              <p><strong>Termination Reason:</strong> {report.terminationReason || 'N/A'}</p>
            </div>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Violation Breakdown</h4>
              {report.violationBreakdown?.length === 0 ? (
                <p style={{ color: '#4caf50', margin: 0 }}>No violations recorded ✓</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#d32f2f' }}>
                  {report.violationBreakdown?.map((v, i) => (
                    <li key={i}>{v.violation_type}: {v.count} instances</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Data */}
        <div>
          <h3 style={{ borderBottom: '2px solid #1976d2', paddingBottom: '8px', display: 'inline-block' }}>AI Interview Results</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px' }}>
              <p><strong>Questions Asked:</strong> {report.questionsAsked || 0}</p>
              <p><strong>Questions Answered:</strong> {report.questionsAnswered || 0}</p>
              <p><strong>Average Answer Score:</strong> {report.averageScore || '0'}/10</p>
            </div>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px' }}>
              <p><strong>Overall Interview Score:</strong> {report.overallScore || 'N/A'}</p>
              <p style={{ marginTop: '10px' }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>AI Final Recommendation:</strong>
                <span style={{ 
                  background: report.aiRecommendation === 'Selected' ? '#e8f5e9' : report.aiRecommendation === 'Rejected' ? '#ffebee' : '#fff3e0',
                  color: report.aiRecommendation === 'Selected' ? '#2e7d32' : report.aiRecommendation === 'Rejected' ? '#c62828' : '#e65100',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  {report.aiRecommendation || 'Pending Review'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* AI Evaluation Summary at the END */}
        {report.summary && (
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
               <div style={{ width: '4px', height: '24px', background: '#3b82f6', borderRadius: '2px' }}></div>
               <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937', fontWeight: '600' }}>AI Evaluation Summary</h3>
            </div>
            <div style={{ background: '#f8f9fa', border: '1px solid #edf2f7', padding: '20px', borderRadius: '8px', color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {report.summary}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
