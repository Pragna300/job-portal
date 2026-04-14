import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../services/api";

const PROCTORING_SERVER_URL = "http://localhost:5000/admin";

export default function LiveProctoring() {
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const fetchLiveCandidates = async () => {
    try {
      const { data } = await api.get("/api/proctoring/live-candidates");
      setCandidates(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load candidates:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCandidates();

    // Setup Socket
    const socket = io(PROCTORING_SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Admin connected to proctoring hub");
    });

    socket.on("violation-detected", ({ sessionId, newIntegrity }) => {
      setCandidates((prev) => 
        prev.map(c => c.session_id === sessionId ? { ...c, integrity_score: newIntegrity, violation_count: parseInt(c.violation_count) + 1 } : c)
      );
    });

    socket.on("warning-sent", ({ sessionId, warningNumber }) => {
      setCandidates((prev) => 
        prev.map(c => c.session_id === sessionId ? { ...c, warnings_count: warningNumber } : c)
      );
    });

    socket.on("interview-terminated", ({ sessionId, reason }) => {
      setCandidates((prev) => 
        prev.map(c => c.session_id === sessionId ? { ...c, status: "TERMINATED", termination_reason: reason } : c)
      );
    });

    // WebRTC Signaling handlers for Admin
    socket.on("webrtc-answer", async ({ candidateId, answer }) => {
      // Find the candidate's actual candidate_id from their socket ID if needed, 
      // but according to the socket relay, backend sends candidateId as candidate socket ID, and admin maps it to candidate ID? 
      // Actually backend `candidateId` from answer is `socket.id`. It is better to map using the actual Candidate ID. Let's find pc.
      // Wait, we need to make sure we parse the candidateId properly.
      const pc = getPeerConnectionForCandidate(candidateId);
      if (pc) {
        try { 
          await pc.setRemoteDescription(new RTCSessionDescription(answer)); 
          // add queued candidates
          if (pc.iceQueue) {
            pc.iceQueue.forEach(cand => pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e=>console.error(e)));
            pc.iceQueue = [];
          }
        } catch(e){
          console.error("Error setting remote answer", e);
        }
      }
    });

    socket.on("webrtc-ice-candidate", async ({ candidateId, candidate }) => {
      const pc = getPeerConnectionForCandidate(candidateId);
      if (pc && candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){ console.error("ICE Admin Error", e); }
        } else {
          pc.iceQueue = pc.iceQueue || [];
          pc.iceQueue.push(candidate);
        }
      }
    });

    return () => {
      Object.values(peerConnections.current).forEach(pc => pc.close());
      socket.disconnect();
    };
  }, []);

  // WebRTC Setup logic
  const peerConnections = useRef({});

  // helper to get or create pc
  const getPeerConnectionForCandidate = (candId) => {
    return peerConnections.current[candId];
  };

  const initiateWebRTC = async (candidateId) => {
    if (!socketRef.current || peerConnections.current[candidateId]) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peerConnections.current[candidateId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("webrtc-ice-candidate", { candidateId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log("Admin got a track for", candidateId);
      const videoEl = document.getElementById(`video-${candidateId}`);
      if (videoEl) {
        if (event.streams && event.streams[0]) {
          videoEl.srcObject = event.streams[0];
        } else {
          let stream = videoEl.srcObject;
          if (!stream) {
            stream = new MediaStream();
            videoEl.srcObject = stream;
          }
          stream.addTrack(event.track);
        }
      }
    };

    // Before creating offer, we must add a transceiver or the offer won't contain video.
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("webrtc-offer", { candidateId, offer });
    } catch (e) {
      console.error("WebRTC Error initiating:", e);
    }
  };

  // Run WebRTC initiation for all initially active candidates
  useEffect(() => {
    candidates.forEach(c => {
      if (c.status === "ACTIVE" && !peerConnections.current[c.candidate_id]) {
        // Wait briefly for DOM to render the <video> tags
        setTimeout(() => initiateWebRTC(c.candidate_id), 1000);
      }
    });
  }, [candidates]);

  const sendWarning = async (candidateId, sessionId) => {
    try {
      await api.post("/api/proctoring/send-warning", { candidateId, sessionId });
      alert("Warning sent to candidate");
    } catch (error) {
      alert(error.response?.data?.message || "Error sending warning");
    }
  };

  const terminateInterview = async (candidateId, sessionId) => {
    if (!window.confirm("Are you sure you want to terminate this interview?")) return;
    try {
      await api.post("/api/proctoring/terminate-interview", { candidateId, sessionId });
      alert("Interview successfully terminated.");
    } catch (error) {
      alert("Failed to terminate interview");
    }
  };

  const clearStaleSessions = async () => {
    if (!window.confirm("Are you sure you want to remove all completed and terminated sessions from the board?")) return;
    try {
      await api.delete("/api/proctoring/cleanup");
      alert("Board cleared successfully.");
      fetchLiveCandidates();
    } catch (error) {
      alert("Failed to clear board.");
    }
  };

  // Filter Logic
  const filteredCandidates = candidates.filter((c) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return c.status === "ACTIVE";
    if (filter === "TERMINATED") return c.status === "TERMINATED";
    if (filter === "COMPLETED") return c.status === "COMPLETED";
    if (filter === "BELOW_70") return c.integrity_score < 70;
    if (filter === "VIOLATIONS") return parseInt(c.violation_count) > 0;
    return true;
  });

  return (
    <div className="admin-page">
      <div className="header-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 className="text-2xl font-bold">Live Proctoring Dashboard</h1>
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="ALL">All Sessions</option>
            <option value="ACTIVE">Active Sessions</option>
            <option value="BELOW_70">Integrity &lt; 70%</option>
            <option value="VIOLATIONS">With Violations</option>
            <option value="TERMINATED">Terminated</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button onClick={fetchLiveCandidates} style={{ marginLeft: "10px", padding: '8px 12px', background: "#1976d2", color: "white", borderRadius: "4px" }}>
            Refresh Data
          </button>
          <button onClick={clearStaleSessions} style={{ marginLeft: "10px", padding: '8px 12px', background: "#757575", color: "white", borderRadius: "4px" }}>
            Clear Finished
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading sessions...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {filteredCandidates.length === 0 ? (
            <p>No candidates match your current filter.</p>
          ) : (
            filteredCandidates.map((c) => (
              <div 
                key={c.session_id} 
                style={{ 
                  border: c.integrity_score < 70 ? "2px solid #ef5350" : "1px solid #ddd", 
                  borderRadius: "8px", 
                  padding: "16px",
                  background: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>{c.candidate_name}</h3>
                  <span style={{ 
                    padding: "4px 8px", 
                    borderRadius: "12px", 
                    fontSize: "0.8rem", 
                    color: "white",
                    background: c.status === 'ACTIVE' ? '#4caf50' : c.status === 'TERMINATED' ? '#f44336' : '#2196f3' 
                  }}>
                    {c.status}
                  </span>
                </div>
                
                {/* WebRTC Video Stream Area */}
                <div style={{ background: "#000", height: "180px", borderRadius: "8px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", overflow: "hidden", position: "relative" }}>
                  {c.status === "ACTIVE" ? (
                    <>
                      <video 
                        id={`video-${c.candidate_id}`} 
                        autoPlay 
                        playsInline 
                        muted
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                      <div className="pulse-dot" style={{ position: "absolute", top: "12px", left: "12px", boxShadow: "0 0 8px #10B981" }} />
                    </>
                  ) : "Stream Closed"}
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px", fontSize: "0.9rem" }}>
                  <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                    <strong>Integrity:</strong> 
                    <span style={{ color: c.integrity_score < 70 ? "#d32f2f" : "#2e7d32", marginLeft: "4px" }}>
                      {c.integrity_score}%
                    </span>
                  </div>
                  <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                    <strong>Violations:</strong> {c.violation_count}
                  </div>
                  <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                    <strong>Warnings:</strong> {c.warnings_count}/3
                  </div>
                  <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                    <strong>Started:</strong> {new Date(c.start_time).toLocaleTimeString()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {c.status === "ACTIVE" && (
                    <>
                      <button 
                        onClick={() => sendWarning(c.candidate_id, c.session_id)}
                        style={{ flex: 1, padding: "8px", background: "#ff9800", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                      >
                        Warn
                      </button>
                      <button 
                        onClick={() => terminateInterview(c.candidate_id, c.session_id)}
                        style={{ flex: 1, padding: "8px", background: "#d32f2f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                      >
                        Stop
                      </button>
                    </>
                  )}
                  <Link 
                    to={`/admin/proctoring/summary/${c.candidate_id}`}
                    style={{ flex: c.status === "ACTIVE" ? 1 : '100%', textAlign: "center", padding: "8px", background: "#f5f5f5", color: "#333", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "none" }}
                  >
                    View Report
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
