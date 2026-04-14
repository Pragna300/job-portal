import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Camera, Mic, Monitor, ShieldCheck,
  AlertTriangle, Play, CheckCircle,
  ChevronRight, Mail, MicOff
} from "lucide-react";
import { getInterviewQuestions, submitInterview, verifyCandidate } from "../services/interviewApi";
import { io } from "socket.io-client";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const PROCTORING_SERVER_URL = "http://localhost:5000/candidate";
const PROCTORING_API_URL   = "http://localhost:5000/api/proctoring";
const RESULT_KEY = "last_interview_result";

const STEPS = {
  EMAIL:  "EMAIL",
  SETUP:  "SETUP",
  INTERVIEW: "INTERVIEW",
  DONE:   "DONE",
};

function getSR() {
  if (typeof window === "undefined") return null;
  return window.webkitSpeechRecognition ?? window.SpeechRecognition ?? null;
}

function speak(text) {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token = "" } = useParams();

  const passedUserId = location.state?.userId || null;

  /* ── state ── */
  const [step,  setStep]  = useState(passedUserId ? STEPS.SETUP : STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [userId,   setUserId]   = useState(passedUserId);
  const [itoken,   setItoken]   = useState(token);
  const [loading,  setLoading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [perms, setPerms] = useState({ camera: false, screen: false });
  const [syncing, setSyncing] = useState(false);
  const [synced,  setSynced]  = useState(false);

  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);                       // question index
  const [answers,  setAnswers]  = useState([]);
  const [transcript, setTranscript] = useState("");
  const [recState,   setRecState]   = useState("idle");  // 'idle' | 'listening'
  const [warning,    setWarning]    = useState("");
  const [sessionId,  setSessionId]  = useState(null);
  const [error,      setError]      = useState("");

  /* ── refs ── */
  const videoRef   = useRef(null);
  const mediaRef   = useRef(null);
  const screenRef  = useRef(null);
  const sockRef    = useRef(null);
  const peersRef   = useRef({});
  const recRef     = useRef(null);
  const modelRef   = useRef(null);
  const throttleRef = useRef(0);
  const spokenRef  = useRef(-1);

  /* ────────────────────────────────────────────
     STEP 1 — Email verification
  ──────────────────────────────────────────── */
  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setEmailErr("Email is required."); return; }
    setLoading(true); setEmailErr("");
    try {
      const { token: t, userId: uid } = await verifyCandidate(email);
      if (!uid) throw new Error("Verification failed. Use the email from your invitation link.");
      setUserId(uid); setItoken(t);
      setStep(STEPS.SETUP);
    } catch (err) {
      setEmailErr(err.message || "Could not verify. Check your email and try again.");
    } finally { setLoading(false); }
  };

  /* ────────────────────────────────────────────
     STEP 2 — Camera / Screen permissions
  ──────────────────────────────────────────── */
  const grantCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaRef.current = s;
      setPerms(p => ({ ...p, camera: true }));
      doSync();
    } catch { setError("Camera or microphone access was denied."); }
  };

  const grantScreen = async () => {
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenRef.current = s;
      setPerms(p => ({ ...p, screen: true }));
      doSync();
    } catch { /* user dismissed */ }
  };

  const doSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setSynced(true); }, 2200);
  };

  const beginInterview = async () => {
    if (!perms.camera || !perms.screen) { alert("Please grant both permissions first."); return; }
    setLoading(true);
    try {
      const qs = await getInterviewQuestions(itoken);
      setQuestions(qs);
      setAnswers(qs.map(q => ({ question: q, answer: "" })));
      setStep(STEPS.INTERVIEW);
    } catch { setError("Could not load questions. Please refresh."); }
    finally { setLoading(false); }
  };

  /* ────────────────────────────────────────────
     STEP 3 — Interview loop
  ──────────────────────────────────────────── */
  useEffect(() => {
    if (step !== STEPS.INTERVIEW || !userId) return;

    const sock = io(PROCTORING_SERVER_URL, { transports: ["websocket", "polling"] });
    sockRef.current = sock;
    sock.on("connect", () => sock.emit("join-session", { candidateId: userId }));

    sock.on("webrtc-offer", async ({ offer, adminId }) => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peersRef.current[adminId] = pc;
        mediaRef.current?.getTracks().forEach(t => pc.addTrack(t, mediaRef.current));
        screenRef.current?.getTracks().forEach(t => pc.addTrack(t, screenRef.current));
        pc.onicecandidate = ev => {
          if (ev.candidate) sock.emit("webrtc-ice-candidate", { adminId, candidateId: userId, candidate: ev.candidate });
        };
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        sock.emit("webrtc-answer", { adminId, candidateId: userId, answer: ans });
      } catch (e) { console.error("WebRTC offer error", e); }
    });

    sock.on("webrtc-ice-candidate", async ({ candidate, adminId }) => {
      const pc = peersRef.current[adminId];
      if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {} }
    });

    sock.on("receive-warning", d => { setWarning(d.message); setTimeout(() => setWarning(""), 8000); });
    sock.on("terminate-interview", d => { alert(`Interview ended: ${d.reason}`); navigate("/"); });

    fetch(`${PROCTORING_API_URL}/start-session`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: userId }),
    }).then(r => r.json()).then(d => { if (d.sessionId) setSessionId(d.sessionId); }).catch(console.error);

    cocoSsd.load().then(m => { modelRef.current = m; });

    const onHidden = () => {
      if (!document.hidden || !sessionId) return;
      fetch(`${PROCTORING_API_URL}/report-violation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: userId, sessionId, violationType: "TAB_SWITCH" }),
      }).catch(console.error);
      setWarning("Tab switch detected and recorded.");
    };
    document.addEventListener("visibilitychange", onHidden);

    const detectionLoop = setInterval(async () => {
      if (!modelRef.current || !videoRef.current || !sessionId) return;
      if (Date.now() - throttleRef.current < 5000) return;
      try {
        const preds = await modelRef.current.detect(videoRef.current);
        let people = 0, mobile = false;
        preds.forEach(p => {
          if (p.class === "person"     && p.score > 0.85) people++;
          if (p.class === "cell phone" && p.score > 0.70) mobile = true;
        });
        const type = mobile ? "MOBILE_DETECTED" : people > 1 ? "MULTIPLE_FACES" : null;
        if (type) {
          throttleRef.current = Date.now();
          fetch(`${PROCTORING_API_URL}/report-violation`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidateId: userId, sessionId, violationType: type }),
          }).catch(console.error);
          setWarning(type === "MOBILE_DETECTED" ? "Mobile phone detected." : "Multiple people detected.");
        }
      } catch {}
    }, 2000);

    return () => {
      sock.disconnect();
      document.removeEventListener("visibilitychange", onHidden);
      clearInterval(detectionLoop);
    };
  }, [step, userId, sessionId, navigate]);

  /* Cleanup streams on unmount */
  useEffect(() => () => {
    mediaRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  /* Attach video stream */
  useEffect(() => {
    if (!videoRef.current || !mediaRef.current) return;
    videoRef.current.srcObject = mediaRef.current;
  }, [step, perms.camera]);

  /* Auto-speak question */
  useEffect(() => {
    if (step === STEPS.INTERVIEW && questions[qi] && spokenRef.current !== qi) {
      speak(questions[qi]);
      spokenRef.current = qi;
    }
  }, [qi, questions, step]);

  /* ─── Speech recording ─── */
  function startRec() {
    const SR = getSR();
    if (!SR) { setError("Speech recognition is not supported in this browser."); return; }
    window.speechSynthesis?.cancel();
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onstart = () => { setRecState("listening"); setTranscript(""); };
    rec.onresult = ev => {
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++)
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
      if (final.trim()) {
        setTranscript(final.trim());
        setAnswers(prev => {
          const next = [...prev];
          next[qi] = { question: questions[qi], answer: final.trim() };
          return next;
        });
      }
    };
    rec.onend = () => setRecState("idle");
    recRef.current = rec;
    rec.start();
  }

  function stopRec() { recRef.current?.stop(); }

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await submitInterview(itoken, answers);
      window.localStorage.setItem(RESULT_KEY, JSON.stringify(result));
      setStep(STEPS.DONE);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────
     RENDERING
  ──────────────────────────────────────────── */

  /* ── STEP 1: Identity Verification ── */
  if (step === STEPS.EMAIL) {
    return (
      <div className="auth-shell">
        <div className="auth-card">

          {/* Logo mark */}
          <div className="auth-logo">
            <ShieldCheck size={22} />
          </div>

          <h1 className="auth-title">Identity Verification</h1>
          <p className="auth-subtitle">
            Enter the email address used in your interview invitation to continue.
          </p>

          <form onSubmit={handleEmail}>
            <div className="field">
              <label className="field-label" htmlFor="email">Email address</label>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {emailErr && (
                <span className="field-error">
                  <AlertTriangle size={13} /> {emailErr}
                </span>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verifying…" : "Continue →"}
            </button>
          </form>

          <p className="auth-note">
            Authorized candidates only. By continuing you agree to be audio and video recorded for this assessment.
          </p>
        </div>
      </div>
    );
  }

  /* ── STEP 2: System Setup ── */
  if (step === STEPS.SETUP) {
    const ready = perms.camera && perms.screen && synced;
    return (
      <div className="setup-shell">
        <header className="portal-header">
          <div className="portal-brand">
            <ShieldCheck size={18} />
            AI Interview Portal
          </div>
        </header>

        <div className="setup-body">
          <div className="setup-card">
            <h1 className="setup-heading">System Setup</h1>
            <p className="setup-desc">
              Grant the following permissions to enable secure proctoring before your interview begins.
            </p>

            {/* Camera tile */}
            <button
              className={`perm-tile${perms.camera ? " perm-tile--granted" : ""}`}
              onClick={perms.camera ? undefined : grantCamera}
              disabled={perms.camera}
            >
              <div className="perm-tile-left">
                <div className="perm-tile-icon">
                  <Camera size={18} />
                </div>
                <div>
                  <div className="perm-tile-title">Camera & Microphone</div>
                  <div className="perm-tile-desc">Used for identity verification and response recording</div>
                </div>
              </div>
              {perms.camera
                ? <CheckCircle size={18} style={{ color: "var(--green)", flexShrink: 0 }} />
                : <ChevronRight size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
              }
            </button>

            {/* Screen tile */}
            <button
              className={`perm-tile${perms.screen ? " perm-tile--granted" : ""}`}
              onClick={perms.screen ? undefined : grantScreen}
              disabled={perms.screen}
            >
              <div className="perm-tile-left">
                <div className="perm-tile-icon">
                  <Monitor size={18} />
                </div>
                <div>
                  <div className="perm-tile-title">Screen Sharing</div>
                  <div className="perm-tile-desc">Ensures no external resources are accessed during the session</div>
                </div>
              </div>
              {perms.screen
                ? <CheckCircle size={18} style={{ color: "var(--green)", flexShrink: 0 }} />
                : <ChevronRight size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
              }
            </button>

            {/* Sync status */}
            {syncing && (
              <div className="sync-row">
                <span className="spinner" />
                Establishing secure proctor connection…
              </div>
            )}

            {/* Rules */}
            <div className="rules-box">
              <ul>
                <li>Ensure you are in a quiet, well-lit environment with no other people present.</li>
                <li>Mobile phones and external notes are strictly prohibited during this session.</li>
                <li>Do not switch browser tabs or minimize the window during the interview.</li>
              </ul>
            </div>

            {error && <p style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>}

            <button
              className="btn-primary"
              onClick={beginInterview}
              disabled={!ready || loading}
            >
              {loading ? "Loading questions…" : "Start Interview"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 3: Interview ── */
  if (step === STEPS.INTERVIEW) {
    const answered   = Boolean(answers[qi]?.answer?.trim());
    const isLast     = qi >= questions.length - 1;
    const progress   = questions.length ? Math.round(((qi + (answered ? 1 : 0)) / questions.length) * 100) : 0;
    const isListening = recState === "listening";

    return (
      <div className="interview-shell">
        {/* Header */}
        <header className="interview-header">
          <div className="portal-brand">
            <ShieldCheck size={16} />
            AI Interview Portal
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-sub)", fontWeight: 500 }}>
            <span className="live-dot" style={{ display: "inline-block" }} />
            Session active
          </div>
        </header>

        {/* Body */}
        <div className="interview-body">
          {/* Video */}
          <div className="video-pane">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="live-badge">
              <span className="live-dot" />
              LIVE
            </div>
          </div>

          {/* Controls */}
          <div className="controls-pane">
            <div className="controls-inner">
              {/* Progress */}
              <div>
                <div className="question-counter">
                  Question {qi + 1} of {questions.length}
                </div>
                <div className="question-progress">
                  <div className="question-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Question */}
              <p className="question-text">{questions[qi]}</p>

              {/* Transcript */}
              <div
                className={
                  "transcript-area" +
                  (isListening ? " transcript-area--listening" : "") +
                  (answered && !isListening ? " transcript-area--answered" : "")
                }
              >
                {isListening ? (
                  <div className="listening-row">
                    <span className="rec-dot" />
                    {transcript || "Listening for your response…"}
                  </div>
                ) : (
                  answers[qi]?.answer || "Your response will appear here after recording."
                )}
              </div>

              <hr className="divider" />

              {/* Action row */}
              <div className="action-row">
                <button className="btn-play" onClick={() => speak(questions[qi])}>
                  <Play size={14} /> Replay
                </button>

                {isListening ? (
                  <button className="btn-record-active" onClick={stopRec}>
                    <MicOff size={14} /> Stop
                  </button>
                ) : (
                  <button className="btn-record-idle" onClick={startRec}>
                    <Mic size={14} /> Record Answer
                  </button>
                )}
              </div>

              {/* Next / Submit */}
              {!isLast ? (
                <button
                  className="btn-ghost"
                  style={{ marginTop: "auto" }}
                  onClick={() => { setQi(i => i + 1); setTranscript(""); }}
                  disabled={!answered}
                >
                  Next Question →
                </button>
              ) : (
                <button
                  className="btn-success"
                  style={{ marginTop: "auto" }}
                  onClick={submit}
                  disabled={!answered || submitting}
                >
                  {submitting ? "Submitting…" : "Submit Interview"}
                </button>
              )}

              {error && (
                <p style={{ fontSize: "0.8125rem", color: "var(--red)", textAlign: "center" }}>{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Warning toast */}
        {warning && (
          <div className="warning-toast">
            <AlertTriangle size={15} /> {warning}
          </div>
        )}
      </div>
    );
  }

  /* ── STEP 4: Test Completed ── */
  if (step === STEPS.DONE) {
    // result is stored in localStorage after submit
    let evalResult = null;
    try {
      const raw = window.localStorage.getItem(RESULT_KEY);
      if (raw) evalResult = JSON.parse(raw);
    } catch {}

    const score = evalResult?.score ?? 0;
    const recommendation = evalResult?.summary?.recommendation
      || evalResult?.recommendation
      || "";
    const summary  = evalResult?.summary?.summary
      || evalResult?.summary
      || "";
    const strengths  = evalResult?.strengths  || evalResult?.summary?.strengths  || [];
    const weaknesses = evalResult?.weaknesses || evalResult?.summary?.weaknesses || [];

    const scoreColor =
      score >= 70 ? "#10b981" :
      score >= 45 ? "#f59e0b" : "#ef4444";

    const recBg =
      (recommendation || "").toLowerCase().includes("hire")   ? "#dcfce7" :
      (recommendation || "").toLowerCase().includes("reject") ? "#fee2e2" : "#fef9c3";
    const recColor =
      (recommendation || "").toLowerCase().includes("hire")   ? "#166534" :
      (recommendation || "").toLowerCase().includes("reject") ? "#991b1b" : "#713f12";

    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center", maxWidth: 520 }}>

          {/* Animated check icon */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg,#10b981,#059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem", boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
            animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            <CheckCircle size={38} color="#fff" />
          </div>

          <h1 className="auth-title" style={{ marginBottom: "0.25rem" }}>Test Completed!</h1>
          <p className="auth-subtitle" style={{ marginBottom: "1.5rem" }}>
            Your interview has been submitted successfully. Our team will review your results shortly.
          </p>

          {/* Score gauge */}
          {score > 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.25rem",
            }}>
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px ${scoreColor}55`,
              }}>
                <div style={{
                  width: 76, height: 76, borderRadius: "50%",
                  background: "var(--bg-card, #1e293b)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontWeight: 800, fontSize: "1.4rem", color: scoreColor, lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: 2 }}>/ 100</span>
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-sub)", marginTop: "0.5rem" }}>
                Your Interview Score
              </p>
            </div>
          )}

          {/* Recommendation badge */}
          {recommendation && (
            <div style={{
              display: "inline-block", padding: "0.35rem 1rem",
              borderRadius: "9999px", fontWeight: 600, fontSize: "0.85rem",
              background: recBg, color: recColor, marginBottom: "1rem",
            }}>
              AI Recommendation: {recommendation}
            </div>
          )}

          {/* Summary */}
          {summary && typeof summary === "string" && (
            <p style={{
              fontSize: "0.875rem", color: "var(--text-sub)",
              lineHeight: 1.6, marginBottom: "1.25rem",
              padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)",
              borderRadius: "0.5rem", textAlign: "left",
            }}>
              {summary}
            </p>
          )}

          {/* Strengths & Weaknesses */}
          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div style={{
              display: "grid", gridTemplateColumns: strengths.length && weaknesses.length ? "1fr 1fr" : "1fr",
              gap: "0.75rem", marginBottom: "1.25rem", textAlign: "left",
            }}>
              {strengths.length > 0 && (
                <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: "0.5rem", padding: "0.75rem" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#10b981", marginBottom: "0.4rem" }}>
                    ✓ Strengths
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.78rem", color: "var(--text-sub)" }}>
                    {strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: "0.5rem", padding: "0.75rem" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#ef4444", marginBottom: "0.4rem" }}>
                    ✗ Areas to Improve
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.78rem", color: "var(--text-sub)" }}>
                    {weaknesses.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            You may safely close this window. A confirmation email will be sent to you.
          </p>

          <button
            className="btn-primary"
            style={{ marginTop: 0 }}
            onClick={() => {
              window.localStorage.removeItem(RESULT_KEY);
              window.close();
              // fallback if window.close() is blocked
              navigate("/");
            }}
          >
            Close Window
          </button>
        </div>

        <style>{`
          @keyframes popIn {
            from { transform: scale(0.6); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
