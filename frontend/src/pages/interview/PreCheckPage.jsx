import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Mic, Monitor, CheckCircle, XCircle, Loader, AlertTriangle } from "lucide-react";

const STEPS = [
  { id: "camera", label: "Webcam", icon: Camera, description: "We need access to your camera for facial monitoring." },
  { id: "mic",    label: "Microphone", icon: Mic, description: "We need your microphone to detect background audio." },
  { id: "screen", label: "Screen Share", icon: Monitor, description: "Full-screen sharing is mandatory for proctoring." },
];

export default function PreCheckPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const videoRef = useRef(null);

  // Skip pre-check if already completed for this token
  useEffect(() => {
    if (sessionStorage.getItem(`precheck-done-${token}`) === "true") {
      navigate(`/interview/${token}`, { replace: true });
    }
  }, [token, navigate]);

  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState({ camera: "idle", mic: "idle", screen: "idle" });
  const [streams, setStreams] = useState({});
  const [error, setError] = useState("");

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      Object.values(streams).forEach((s) => s?.getTracks().forEach((t) => t.stop()));
    };
  }, [streams]);

  const setStatus = (id, val) => setStatuses((p) => ({ ...p, [id]: val }));

  const runCheck = async () => {
    const current = STEPS[step];
    setError("");
    setStatus(current.id, "loading");
    try {
      let stream;
      if (current.id === "camera") {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) { videoRef.current.srcObject = stream; }
      } else if (current.id === "mic") {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (current.id === "screen") {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      }
      setStreams((p) => ({ ...p, [current.id]: stream }));
      setStatus(current.id, "ok");
    } catch (err) {
      setStatus(current.id, "fail");
      setError(`Permission denied for ${current.label}. Please allow access and try again.`);
    }
  };

  const allDone = STEPS.every((s) => statuses[s.id] === "ok");
  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  const statusIcon = (id) => {
    const s = statuses[id];
    if (s === "ok")      return <CheckCircle size={20} className="text-green-500" />;
    if (s === "fail")    return <XCircle size={20} className="text-red-500" />;
    if (s === "loading") return <Loader size={20} className="text-blue-500 animate-spin" />;
    return <span className="w-5 h-5 rounded-full border-2 border-[var(--border-color)] inline-block" />;
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "680px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "99px", padding: "0.4rem 1rem", marginBottom: "1rem" }}>
            <AlertTriangle size={14} style={{ color: "#818cf8" }} />
            <span style={{ fontSize: "0.8rem", color: "#818cf8", fontWeight: "600" }}>AI Proctoring Pre-Check</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: "800", margin: 0 }}>System Requirements Check</h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Complete all 3 checks to begin your AI Interview</p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: "4px", borderRadius: "2px", background: statuses[s.id] === "ok" ? "#22c55e" : i === step ? "#6366f1" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
          ))}
        </div>

        {/* Check Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {STEPS.map((s, i) => {
            const SIcon = s.icon;
            const isActive = i === step;
            const isDone = statuses[s.id] === "ok";
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: isActive ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? "rgba(99,102,241,0.4)" : isDone ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: "12px", padding: "1rem 1.25rem", transition: "all 0.3s" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: isDone ? "rgba(34,197,94,0.15)" : isActive ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SIcon size={20} style={{ color: isDone ? "#22c55e" : isActive ? "#818cf8" : "#64748b" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: isDone ? "#22c55e" : isActive ? "white" : "#64748b", fontWeight: "600", margin: 0, fontSize: "0.95rem" }}>{s.label}</p>
                  {isActive && <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>{s.description}</p>}
                  {isDone && <p style={{ color: "#22c55e", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>✓ Connected successfully</p>}
                </div>
                {statusIcon(s.id)}
              </div>
            );
          })}
        </div>

        {/* Camera Preview */}
        {statuses.camera === "ok" && (
          <div style={{ marginBottom: "1.5rem", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(34,197,94,0.3)", background: "#000", position: "relative", aspectRatio: "16/5" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(34,197,94,0.8)", color: "white", fontSize: "0.7rem", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px" }}>CAMERA LIVE</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5", fontSize: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <XCircle size={16} /> {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "1rem" }}>
          {!allDone && (
            <button
              onClick={runCheck}
              disabled={statuses[currentStep.id] === "loading"}
              style={{ flex: 1, padding: "0.9rem", borderRadius: "10px", border: "none", background: statuses[currentStep.id] === "loading" ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontWeight: "700", fontSize: "1rem", cursor: statuses[currentStep.id] === "loading" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {statuses[currentStep.id] === "loading" ? (<><Loader size={18} className="animate-spin" /> Checking...</>) : statuses[currentStep.id] === "ok" ? "Next Check →" : `Test ${currentStep.label}`}
            </button>
          )}

          {statuses[currentStep.id] === "ok" && !allDone && (
            <button onClick={() => setStep((p) => Math.min(p + 1, STEPS.length - 1))}
              style={{ padding: "0.9rem 1.5rem", borderRadius: "10px", border: "1px solid rgba(99,102,241,0.4)", background: "transparent", color: "#818cf8", fontWeight: "600", cursor: "pointer" }}>
              Next →
            </button>
          )}

          {allDone && (
            <button
              onClick={() => {
            sessionStorage.setItem(`precheck-done-${token}`, "true");
            Object.values(streams).forEach((s) => s?.getTracks().forEach((t) => t.stop()));
            navigate(`/interview/${token}`);
          }}
              style={{ flex: 1, padding: "0.9rem", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              <CheckCircle size={20} /> All Checks Passed — Begin Interview
            </button>
          )}
        </div>

        <p style={{ textAlign: "center", color: "#475569", fontSize: "0.75rem", marginTop: "1.5rem" }}>
          Your devices are used solely for proctoring. Streams are not recorded to external servers.
        </p>
      </div>
    </main>
  );
}
