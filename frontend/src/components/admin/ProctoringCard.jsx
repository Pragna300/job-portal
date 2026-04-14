import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { AlertCircle, Shield, Octagon } from "lucide-react";

// STUN servers for reliable ICE gathering (even on localhost)
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function ProctoringCard({ candidate, onWarning, onStop, socket }) {
  const videoRef      = useRef(null);
  const screenRef     = useRef(null);
  const peerRef       = useRef(null);
  const [status, setStatus] = useState("waiting"); // waiting|connecting|live|error

  useEffect(() => {
    if (!socket) return;

    // ── Destroy helper ─────────────────────────────────────────────────
    const destroy = () => {
      if (peerRef.current) {
        try { peerRef.current.destroy(); } catch (_) {}
        peerRef.current = null;
      }
    };

    const onSignal = (data) => {
      if (String(data.candidateId) !== String(candidate.candidate_id)) return;
      
      if (!peerRef.current) {
        console.log("[Admin WebRTC] Got offer from candidate, creating non-initiator peer");
        setStatus("connecting");
        const peer = new Peer({ initiator: false, trickle: true, config: ICE_SERVERS });
        peerRef.current = peer;

        peer.on("signal", (signal) => {
          socket.emit("signal", {
            signal,
            to: String(candidate.candidate_id),
            candidateId: String(candidate.candidate_id),
          });
        });

        peer.on("stream", (stream) => {
          console.log("[Admin WebRTC] Got stream:", stream.id, "tracks:", stream.getTracks().length);
          if (videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = stream;
            setStatus("live");
          } else if (screenRef.current && (!screenRef.current.srcObject || screenRef.current.srcObject.id !== stream.id)) {
            screenRef.current.srcObject = stream;
          }
        });

        peer.on("connect", () => {
          console.log("[Admin WebRTC] P2P connection established!");
          setStatus("live");
        });

        peer.on("error", (err) => {
          console.error("[Admin WebRTC] Error:", err.message);
          setStatus("error");
        });

        peer.on("close", () => {
          console.log("[Admin WebRTC] Peer closed");
          setStatus("waiting");
          peerRef.current = null;
        });
      }

      console.log("[Admin WebRTC] Received signal chunk from candidate");
      try { peerRef.current.signal(data.signal); } catch (e) { console.error(e); }
    };

    // When candidate comes online (joins their socket room) → request stream connection
    const onCandidateOnline = (data) => {
      if (String(data.candidateId) !== String(candidate.candidate_id)) return;
      console.log("[Admin WebRTC] Candidate came online → requesting stream");
      socket.emit("request-stream-handshake", { candidateId: String(candidate.candidate_id) });
    };

    // ── Register listeners ─────────────────────────────────────────────
    socket.on("signal",                    onSignal);
    socket.on("candidate-online",          onCandidateOnline);

    // Initial: tell candidate we want to watch (in case they're already in their room)
    if (status === "waiting") {
      console.log("[Admin WebRTC] Sending initial handshake request...");
      socket.emit("request-stream-handshake", { candidateId: String(candidate.candidate_id) });
    }

    return () => {
      socket.off("signal",                    onSignal);
      socket.off("candidate-online",          onCandidateOnline);
      destroy();
    };
  }, [candidate.candidate_id, socket]);

  // ── UI ────────────────────────────────────────────────────────────────
  const isLowIntegrity = (candidate.integrity_score ?? 100) < 70;

  const badge = {
    waiting:    { text: "○ WAITING",    bg: "#4a5568", color: "white"   },
    connecting: { text: "◌ CONNECTING", bg: "#2b6cb0", color: "white"   },
    live:       { text: "● LIVE",       bg: "#276749", color: "#c6f6d5" },
    error:      { text: "⚠ ERROR",      bg: "#c53030", color: "white"   },
  }[status];

  return (
    <div style={{
      background: "white", borderRadius: "12px", padding: "1.25rem",
      display: "flex", flexDirection: "column", gap: "1rem",
      border: `2px solid ${isLowIntegrity ? "#feb2b2" : "#e2e8f0"}`,
      boxShadow: isLowIntegrity ? "0 0 15px rgba(245,101,101,0.2)" : "0 4px 6px rgba(0,0,0,0.05)",
    }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, color: "#2d3748", fontSize: "1rem" }}>{candidate.candidate_name}</h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#718096" }}>Session: {candidate.id}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <span style={{ background: badge.bg, color: badge.color, padding: "2px 10px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: "bold" }}>
            {badge.text}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#718096" }}>{candidate.status}</span>
        </div>
      </div>

      {/* Video Feeds */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {/* Webcam */}
        <div style={{ background: "#1a202c", borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3", position: "relative" }}>
          <video ref={videoRef} autoPlay muted playsInline
            onClick={(e) => { e.currentTarget.muted = !e.currentTarget.muted; }}
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
          {status !== "live" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#718096" }}>
              <span style={{ fontSize: "1.5rem" }}>📹</span>
              <span style={{ fontSize: "0.65rem", marginTop: "6px" }}>Waiting for candidate...</span>
            </div>
          )}
          <span style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.55)", color: "white", fontSize: "0.6rem", padding: "2px 5px", borderRadius: "4px", pointerEvents: "none" }}>
            Webcam · click for audio
          </span>
        </div>

        {/* Screen Share */}
        <div style={{ background: "#1a202c", borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3", position: "relative" }}>
          <video ref={screenRef} autoPlay muted playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          {status !== "live" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#718096" }}>
              <span style={{ fontSize: "1.5rem" }}>🖥️</span>
              <span style={{ fontSize: "0.65rem", marginTop: "6px" }}>Screen</span>
            </div>
          )}
          <span style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.55)", color: "white", fontSize: "0.6rem", padding: "2px 5px", borderRadius: "4px" }}>
            Screen
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        {[
          { label: "Integrity",  value: `${candidate.integrity_score ?? 100}%`, danger: isLowIntegrity },
          { label: "Violations", value: candidate.violation_count ?? 0 },
          { label: "Warnings",   value: `${candidate.warnings_sent ?? 0}/3` },
        ].map(({ label, value, danger }) => (
          <div key={label}>
            <p style={{ margin: 0, fontSize: "0.65rem", textTransform: "uppercase", color: "#718096", marginBottom: "2px" }}>{label}</p>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "1.1rem", color: danger ? "#e53e3e" : "#2d3748" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        <button
          onClick={() => onWarning(candidate.candidate_id, (candidate.warnings_sent ?? 0) + 1)}
          disabled={(candidate.warnings_sent ?? 0) >= 3}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "0.55rem", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.8rem", opacity: (candidate.warnings_sent ?? 0) >= 3 ? 0.4 : 1 }}
        >
          <AlertCircle size={15} color="#dd6b20" /> Warn
        </button>
        <button
          onClick={() => window.open(`/api/proctoring/session-summary/${candidate.candidate_id}`, "_blank")}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "0.55rem", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.8rem" }}
        >
          <Shield size={15} color="#2b6cb0" /> Report
        </button>
        <button
          onClick={() => onStop(candidate.candidate_id)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "0.55rem", borderRadius: "8px", border: "none", background: "#fff5f5", color: "#c53030", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
        >
          <Octagon size={15} /> Stop
        </button>
      </div>
    </div>
  );
}
