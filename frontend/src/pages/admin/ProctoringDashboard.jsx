import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";
import ProctoringCard from "../../components/admin/ProctoringCard";

export default function ProctoringDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  // CRITICAL FIX: Use useState (not useRef) so ProctoringCard re-renders when socket connects
  const [adminSocket, setAdminSocket] = useState(null);

  useEffect(() => {
    const fetchLiveCandidates = async () => {
      try {
        const res = await api.get("/api/proctoring/live-candidates");
        setCandidates(res.data);
      } catch (err) {
        console.error("Fetch Live Candidates Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveCandidates();

    // Initialize Socket
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const socket = io(`${baseURL}/admin`, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      console.log("[Admin Socket] Connected:", socket.id);
      socket.emit("join-admin-panel");
      // CRITICAL: Set socket in state so ProctoringCards re-render with a valid socket
      setAdminSocket(socket);
    });

    socket.on("connect_error", (err) => {
      console.error("[Admin Socket] Connection error:", err.message);
    });

    socket.on("candidate-online", (data) => {
      console.log("[Admin] Candidate online:", data.candidateId);
      // Refresh list when a new candidate joins
      fetchLiveCandidates();
    });

    socket.on("candidate-status-update", (data) => {
      setCandidates(prev => prev.map(c =>
        String(c.candidate_id) === String(data.candidateId)
          ? { ...c, status: data.status, integrity_score: 0 }
          : c
      ));
    });

    socket.on("integrity-score-update", (data) => {
      setCandidates(prev => prev.map(c =>
        String(c.candidate_id) === String(data.candidateId)
          ? { ...c, integrity_score: data.integrityScore, violation_count: data.violationCount }
          : c
      ));
    });

    return () => {
      socket.disconnect();
      setAdminSocket(null);
    };
  }, []);

  const sendWarning = (candidateId, warningNumber) => {
    if (adminSocket) {
      adminSocket.emit("send-warning", {
        candidateId,
        warningNumber,
        message: `Warning #${warningNumber}: Please follow proctoring rules.`
      });
    }
  };

  const stopInterview = (candidateId) => {
    if (adminSocket) {
      adminSocket.emit("terminate-interview", {
        candidateId,
        reason: "Terminated manually by administrator."
      });
    }
  };

  const filteredCandidates = candidates.filter(c => {
    if (filter === "all") return true;
    if (filter === "low-integrity") return c.integrity_score < 70;
    if (filter === "violations") return c.violation_count > 0;
    return true;
  });

  return (
    <div className="admin-dashboard-shell" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Live Proctoring Monitor</h1>
          <p className="muted">Real-time surveillance of active interview sessions</p>
        </div>
        <div className="filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e0' }}
          >
            <option value="all">All Sessions</option>
            <option value="low-integrity">Low Integrity (&lt;70%)</option>
            <option value="violations">With Violations</option>
          </select>
          <div className="stats-badge" style={{ padding: '0.5rem 1rem', background: adminSocket ? '#ebf8ff' : '#fff5f5', borderRadius: '8px', color: adminSocket ? '#2b6cb0' : '#c53030', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {adminSocket ? `● Active: ${candidates.length}` : '○ Connecting...'}
          </div>
        </div>
      </header>

      {loading ? (
        <p>Loading live sessions...</p>
      ) : filteredCandidates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: '#f7fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎥</p>
          <p className="muted" style={{ fontSize: '1.1rem' }}>No active interview sessions found.</p>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Candidates will appear here once they start their interview.</p>
        </div>
      ) : (
        <div className="proctoring-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCandidates.map(candidate => (
            <ProctoringCard
              key={candidate.id}
              candidate={candidate}
              onWarning={sendWarning}
              onStop={stopInterview}
              socket={adminSocket}  // Now updates when socket connects
            />
          ))}
        </div>
      )}
    </div>
  );
}
