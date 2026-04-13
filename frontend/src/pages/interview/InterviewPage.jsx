import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import * as faceapi from "@vladmandic/face-api";
import Peer from "simple-peer";
import { getInterviewQuestions, submitInterview } from "../../services/interviewApi";
import api from "../../services/api";

const INTERVIEW_RESULT_STORAGE_KEY = "ai-interview-result";
const MAX_VIOLATIONS = 3; // 4th violation = disqualification

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.webkitSpeechRecognition ?? window.SpeechRecognition ?? null;
}

function speakQuestion(question) {
  if (!question || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(question);
  speech.lang = "en-US";
  window.speechSynthesis.speak(speech);
}

// Disqualified Screen
function DisqualifiedScreen({ reason }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a0000, #2d0000)", padding: "2rem" }}>
      <div style={{ maxWidth: "520px", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚫</div>
        <h1 style={{ color: "#fc8181", fontWeight: "800", fontSize: "2rem", margin: "0 0 1rem" }}>Disqualified</h1>
        <p style={{ color: "#fca5a5", lineHeight: "1.7", marginBottom: "2rem" }}>
          Your interview session has been <strong>permanently terminated</strong> due to repeated proctoring violations.
        </p>
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "1rem 1.5rem", marginBottom: "2rem", textAlign: "left" }}>
          <p style={{ color: "#fca5a5", fontSize: "0.85rem", fontWeight: "600", margin: "0 0 0.5rem" }}>Reason:</p>
          <p style={{ color: "#fecaca", fontSize: "0.9rem", margin: 0 }}>{reason || "Violation threshold exceeded (3+ violations)."}</p>
        </div>
        <p style={{ color: "#6b7280", fontSize: "0.8rem" }}>
          This decision has been logged and cannot be appealed through this portal. Please contact HR for further assistance.
        </p>
      </div>
    </div>
  );
}

// Warning Overlay
function WarningOverlay({ warning, onDismiss }) {
  if (!warning) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "2.5rem", maxWidth: "420px", textAlign: "center", border: "4px solid #f56565", animation: "shake 0.4s ease" }}>
        <div style={{ fontSize: "3rem", margin: "0 0 1rem" }}>⚠️</div>
        <h2 style={{ color: "#c53030", margin: "0 0 0.75rem", fontWeight: "800" }}>WARNING {warning.warningNumber}/3</h2>
        <p style={{ color: "#4a5568", lineHeight: "1.6", marginBottom: "1.5rem" }}>{warning.message}</p>
        {warning.warningNumber >= 3 && (
          <p style={{ color: "#c53030", fontWeight: "700", fontSize: "0.9rem", marginBottom: "1rem" }}>
            🚨 Next violation will result in IMMEDIATE DISQUALIFICATION
          </p>
        )}
        <button onClick={onDismiss} style={{ padding: "0.75rem 2rem", background: "#c53030", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" }}>
          I Understand
        </button>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();

  // Refs
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const transcriptRef = useRef("");
  const answersRef = useRef([]);
  const currentIndexRef = useRef(0);
  const currentQuestionRef = useRef("");
  const socketRef = useRef(null);
  const screenStreamRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const objectIntervalRef = useRef(null);
  const peerRef = useRef(null);
  const isTerminatedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const cocoModelRef = useRef(null);
  const violationCountRef = useRef(0);

  // State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [voiceState, setVoiceState] = useState("Idle");
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cameraState, setCameraState] = useState("Loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [violationCount, setViolationCount] = useState(0);
  const [activeWarning, setActiveWarning] = useState(null);

  // Layout states
  const [answerMode, setAnswerMode] = useState("voice"); // 'voice' | 'code'
  const [warningCount, setWarningCount] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualReason, setDisqualReason] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const currentQuestion = questions[currentIndex] ?? "";
  const currentAnswer = answers[currentIndex]?.answer ?? "";
  const hasCapturedAnswer = Boolean(currentAnswer.trim());
  const isLastQuestion = currentIndex >= questions.length - 1;
  const progressLabel = questions.length ? `Question ${currentIndex + 1} of ${questions.length}` : "Initializing session...";

  // Disqualify handler
  const handleDisqualify = useCallback((reason) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    setIsDisqualified(true);
    setDisqualReason(reason);
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    clearInterval(faceIntervalRef.current);
    clearInterval(objectIntervalRef.current);
    socketRef.current?.emit("candidate-disqualified", { candidateId: "self", reason });
    socketRef.current?.disconnect();
    // Mark application as rejected in DB
    api.post("/api/proctoring/disqualify", { sessionId: sessionIdRef.current, reason }).catch(() => {});
  }, []);

  // Report Violation — LOCAL-FIRST for immediate UI feedback
  const reportViolation = useCallback(async (type) => {
    if (isTerminatedRef.current) return;

    // 1. Update UI immediately (local)
    const newLocalCount = violationCountRef.current + 1;
    violationCountRef.current = newLocalCount;
    setViolationCount(newLocalCount);

    const deductions = {
      TAB_SWITCH: 10, FACE_NOT_DETECTED: 15,
      CAMERA_OFF: 20, MULTIPLE_FACES: 25, MOBILE_PHONE_DETECTED: 20
    };
    const deduction = deductions[type] || 5;
    setIntegrityScore((prev) => Math.max(0, prev - deduction));

    const humanFormat = type.replace(/_/g, ' ');

    setActiveWarning({
      message: `VIOLATION DETECTED: ${humanFormat}. Your integrity score was reduced by ${deduction}. Keep your focus on the screen.`,
      warningNumber: newLocalCount
    });

    // 2. Strict disqualification check
    if (newLocalCount > MAX_VIOLATIONS) {
      handleDisqualify(`Disqualified after ${newLocalCount} violations. Last: ${humanFormat}`);
      return;
    }

    // 3. Sync to backend in background
    if (sessionIdRef.current) {
      try {
        const res = await api.post("/api/proctoring/report-violation", {
          sessionId: sessionIdRef.current,
          violationType: type,
        });
        // Sync backend score if available
        if (res.data?.integrityScore !== undefined) {
          setIntegrityScore(res.data.integrityScore);
        }
        socketRef.current?.emit("violation-detected", {
          candidateId: "self",
          integrityScore: res.data?.integrityScore,
          violationCount: newLocalCount,
          violationType: type,
        });
      } catch (_) {
        // Backend sync failed — local state is still correct
      }
    }
  }, [handleDisqualify]);

  // 1. Initialize Proctoring & WebRTC
  useEffect(() => {
    let isMounted = true;
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    async function initProctoring() {
      try {
        // Load face-api models
        await faceapi.nets.tinyFaceDetector.loadFromUri(
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"
        );

        // Get Webcam & Screen
        const webcam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });

        if (!isMounted) return;
        mediaStreamRef.current = webcam;
        screenStreamRef.current = screen;
        setCameraState("Live");

        if (videoRef.current) {
          videoRef.current.srcObject = webcam;
          videoRef.current.play().catch(() => {});
        }

        // Start Backend Session
        try {
          const sessionRes = await api.post("/api/proctoring/start-session", { token });
          sessionIdRef.current = sessionRes.data.sessionId;
          const serverCandidateId = sessionRes.data.candidateId || "self";
          setSessionId(sessionRes.data.sessionId);
          
          // Connect Socket with REAL candidateId
          const socket = io(`${baseURL}/candidate`);
          socketRef.current = socket;
          socket.emit("join-session", { candidateId: serverCandidateId, sessionId: sessionRes.data.sessionId });

          // WebRTC signaling
          const peer = new Peer({ initiator: false, trickle: false });
          webcam.getTracks().forEach((track) => peer.addTrack(track, webcam));
          screen.getTracks().forEach((track) => peer.addTrack(track, screen));
          peer.on("signal", (signal) => socket.emit("signal", { candidateId: serverCandidateId, signal }));
          socket.on("signal", (data) => { 
            // Validate signal and process it
            if (data.signal) peer.signal(data.signal); 
          });
          peerRef.current = peer;
        } catch (_) {
          sessionIdRef.current = "local-" + Date.now();
        }

        // Receive warnings from admin
        socket.on("receive-warning", (data) => {
          setWarningCount((p) => {
            const next = p + 1;
            setActiveWarning({ ...data, warningNumber: next });
            if (next >= 3) {
              // Next violation will disqualify — warn user
            }
            return next;
          });
        });

        socket.on("terminate-interview", (data) => {
          handleDisqualify(data.reason || "Terminated by administrator.");
        });

      } catch (err) {
        console.error("Proctoring Init:", err);
        setCameraState("Error");
        setError("Camera or Screen permission denied. Please refresh the page and allow permissions.");
      }
    };
    
    // Store in window or ref if needed
    window._startProctoring = initProctoring;

    // Tab switching detection
    const handleVisibility = () => {
      if (document.hidden && !isTerminatedRef.current) {
        reportViolation("TAB_SWITCH");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      socketRef.current?.disconnect();
      clearInterval(faceIntervalRef.current);
      clearInterval(objectIntervalRef.current);
    };
  }, [token, reportViolation, handleDisqualify]);

  // 2. Face & Object Detection Loop
  useEffect(() => {
    if (cameraState !== "Live" || !videoRef.current) return;

    // Face detection every 5s
    faceIntervalRef.current = setInterval(async () => {
      if (isTerminatedRef.current || !videoRef.current) return;
      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 })
        );
        if (detections.length === 0) {
          reportViolation("FACE_NOT_DETECTED");
        } else if (detections.length > 1) {
          reportViolation("MULTIPLE_FACES");
        }
      } catch (_) {}
    }, 5000);

    // Load COCO-SSD lazily for phone detection
    let cocoLoaded = false;
    const loadCoco = async () => {
      try {
        // Dynamic import to avoid blocking main bundle
        const tf = await import("@tensorflow/tfjs");
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        const model = await cocoSsd.load();
        cocoModelRef.current = model;
        cocoLoaded = true;
      } catch (_) {}
    };
    loadCoco();

    // Object (phone) detection every 10s
    objectIntervalRef.current = setInterval(async () => {
      if (isTerminatedRef.current || !videoRef.current || !cocoModelRef.current) return;
      try {
        const predictions = await cocoModelRef.current.detect(videoRef.current);
        const bannedItems = ["cell phone", "remote", "laptop", "tablet"];
        const hasPhone = predictions.some(
          (p) => bannedItems.includes(p.class) && p.score > 0.35
        );
        
        // Debug logging for detection health
        if (predictions.length > 0) {
          console.log("[AI Monitor] Detected:", predictions.map(p => `${p.class} (${Math.round(p.score*100)}%)`).join(", "));
        }

        if (hasPhone) {
          // Immediately report violation for phones. Strict policy.
          reportViolation("MOBILE_PHONE_DETECTED");
        }
      } catch (_) {}
    }, 10000);

    return () => {
      clearInterval(faceIntervalRef.current);
      clearInterval(objectIntervalRef.current);
    };
  }, [cameraState, reportViolation]);

  // 3. Load Questions
  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      try {
        const loaded = await getInterviewQuestions(token);
        if (isMounted) { setQuestions(loaded); setCurrentIndex(0); setIsLoading(false); }
      } catch (_) { setError("Failed to load questions."); setIsLoading(false); }
    }
    loadQuestions();
    return () => { isMounted = false; window.speechSynthesis?.cancel(); };
  }, [token]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    if (!isLoading && questions[currentIndex] && cameraState === "Live") {
      speakQuestion(questions[currentIndex]);
    }
  }, [currentIndex, isLoading, questions, cameraState]);

  // Voice answer helpers
  const updateAnswer = (answerText, qIdx = currentIndexRef.current) => {
    answersRef.current[qIdx] = { question: questions[qIdx] ?? "", answer: answerText };
    setAnswers((prev) => { const next = [...prev]; next[qIdx] = answersRef.current[qIdx]; return next; });
  };

  const startRecording = () => {
    const SR = getSpeechRecognition();
    if (!SR) return setError("Speech recognition not supported in this browser.");
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    const r = new SR();
    r.onstart = () => { setVoiceState("Listening"); setTranscript(""); };
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      transcriptRef.current = t.trim();
      setTranscript(t.trim());
      updateAnswer(t.trim());
    };
    r.onend = () => setVoiceState(transcriptRef.current ? "Done" : "Idle");
    r.onerror = () => setVoiceState("Idle");
    recognitionRef.current = r;
    r.start();
  };

  const stopRecording = () => { setVoiceState("Processing"); recognitionRef.current?.stop(); };

  async function handleSubmitInterview() {
    setIsSubmitting(true);
    try {
      const result = await submitInterview(token, answersRef.current);
      localStorage.setItem(INTERVIEW_RESULT_STORAGE_KEY, JSON.stringify(result));
      navigate(`/interview/result/${token}`);
    } catch (_) { setError("Submission failed. Please try again."); }
    setIsSubmitting(false);
  }

  // Screens
  if (isDisqualified) return <DisqualifiedScreen reason={disqualReason} />;

  const integrityColor = integrityScore >= 80 ? "#22c55e" : integrityScore >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <main className="interview-shell">
      {/* Warning Overlay */}
      <WarningOverlay warning={activeWarning} onDismiss={() => setActiveWarning(null)} />

      {/* Proctoring Status Bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: integrityScore < 70 ? "rgba(127,29,29,0.95)" : "rgba(15,23,42,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: `2px solid ${integrityColor}40`,
        padding: "0.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: "600" }}>
            🔴 LIVE PROCTORING
          </span>
          <span style={{ color: "white", fontSize: "0.85rem" }}>
            Integrity: <strong style={{ color: integrityColor }}>{integrityScore}%</strong>
          </span>
          <span style={{ color: "white", fontSize: "0.85rem" }}>
            Violations: <strong style={{ color: violationCount > 0 ? "#f59e0b" : "white" }}>{violationCount}/{MAX_VIOLATIONS + 1}</strong>
          </span>
          <span style={{ color: "white", fontSize: "0.85rem" }}>
            Warnings: <strong style={{ color: warningCount > 0 ? "#ef4444" : "white" }}>{warningCount}/3</strong>
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Webcam + Screen — Monitored by AI</div>
      </div>

      {/* Main Content */}
      <section className="interview-layout" style={{ paddingTop: "3.5rem" }}>
        <header className="question-card">
          <div className="question-header">
            <div>
              <p className="eyebrow">{progressLabel}</p>
              <h1>AI Interview Session</h1>
            </div>
            <button className="icon-button" onClick={() => speakQuestion(currentQuestion)}>SPK</button>
          </div>
          <p className="question-text">{isLoading ? "Retrieving questions..." : currentQuestion}</p>
        </header>

        <section className="interview-grid">
          <article className="voice-card">
            <div className="panel-title-row">
              <div style={{ display: "flex", gap: "1rem" }}>
                <h2 
                  onClick={() => setAnswerMode("voice")}
                  style={{ cursor: "pointer", color: answerMode === "voice" ? "white" : "#64748b", borderBottom: answerMode === "voice" ? "2px solid #3b82f6" : "none" }}
                >
                  Voice Answer
                </h2>
                <h2 
                  onClick={() => setAnswerMode("code")}
                  style={{ cursor: "pointer", color: answerMode === "code" ? "white" : "#64748b", borderBottom: answerMode === "code" ? "2px solid #3b82f6" : "none" }}
                >
                  Code/Query
                </h2>
              </div>
              <span className="status-pill">{answerMode === "voice" ? voiceState : "Typing"}</span>
            </div>

            {answerMode === "voice" ? (
              <div className="transcript-box">
                <p className={transcript || currentAnswer ? "transcript-text" : "transcript-empty"}>
                  {transcript || currentAnswer || "Recording will appear here..."}
                </p>
              </div>
            ) : (
              <div className="code-editor-container" style={{ width: "100%", height: "200px" }}>
                <textarea
                  className="code-editor"
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={"/* Type your code or SQL query here...\n\nExample:\nfunction solution() {\n  return true;\n}\n*/"}
                  style={{
                    width: "100%", height: "100%", padding: "1rem", borderRadius: "8px",
                    background: "#0f172a", color: "#e2e8f0", fontFamily: "monospace",
                    border: "1px solid #1e293b", resize: "none", fontSize: "0.9rem"
                  }}
                  spellCheck={false}
                />
              </div>
            )}
            
            {error && <p className="form-error">{error}</p>}
          </article>

          <aside className="video-card">
            <div className="panel-title-row">
              <h2>Live Proctoring</h2>
              <span className="video-badge" style={{ background: cameraState === "Live" ? "#22c55e" : "#f59e0b" }}>
                {cameraState}
              </span>
            </div>
            
            <div style={{ position: "relative", minHeight: "200px" }}>
              <video 
                ref={videoRef} 
                className="camera-feed" 
                autoPlay 
                muted 
                playsInline 
                width="640" 
                height="480"
                style={{ width: "100%", height: "auto", display: "block" }} 
              />
              
              {/* Added Button to fix Chrome getDisplayMedia user gesture restriction */}
              {cameraState === "Loading" && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.9)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", zIndex: 10 }}>
                  <button 
                    onClick={() => { 
                      // Unlock audio synthesis in modern browsers by triggering during a user gesture
                      if (window.speechSynthesis) {
                        const utterance = new SpeechSynthesisUtterance("");
                        utterance.volume = 0;
                        window.speechSynthesis.speak(utterance);
                        
                        // Also speak the first question immediately if ready
                        if (questions[currentIndex]) {
                          speakQuestion(questions[currentIndex]);
                        }
                      }
                      window._startProctoring(); 
                      setCameraState("Starting..."); 
                    }}
                    className="primary-button" style={{ padding: "0.75rem 1.5rem" }}
                  >
                    ▶ Enable Camera & Screen
                  </button>
                </div>
              )}
            </div>

            {integrityScore < 80 && (
              <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "0.75rem", color: "#fca5a5" }}>
                ⚠️ Integrity below threshold. Next violation may result in disqualification.
              </div>
            )}
          </aside>
        </section>

        <footer className="controls-card">
          <button 
            className="secondary-button" 
            onClick={voiceState === "Listening" ? stopRecording : startRecording}
            disabled={isLoading}
          >
            {voiceState === "Listening" ? "⏹ Stop Recording" : "🎙 Start Recording"}
          </button>
          {isLastQuestion ? (
            <button className="primary-button" onClick={handleSubmitInterview} disabled={!hasCapturedAnswer || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Finish Interview"}
            </button>
          ) : (
            <button className="secondary-button" onClick={() => { setCurrentIndex((p) => p + 1); setTranscript(""); }}>
              Next Question →
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
