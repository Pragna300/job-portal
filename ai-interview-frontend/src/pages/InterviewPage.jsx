import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getInterviewQuestions, submitInterview } from "../services/interviewApi";

const INTERVIEW_RESULT_STORAGE_KEY = "ai-interview-result";

function getSpeechRecognition() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.webkitSpeechRecognition ?? window.SpeechRecognition ?? null;
}

function speakQuestion(question) {
  if (!question || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(question);
  speech.lang = "en-US";
  speech.rate = 1;
  window.speechSynthesis.speak(speech);
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const transcriptRef = useRef("");
  const answersRef = useRef([]);
  const currentIndexRef = useRef(0);
  const currentQuestionRef = useRef("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [voiceState, setVoiceState] = useState("Idle");
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cameraState, setCameraState] = useState("Loading");
  const [cameraError, setCameraError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentQuestion = questions[currentIndex] ?? "";
  const currentAnswer = answers[currentIndex]?.answer ?? "";
  const hasCapturedAnswer = Boolean(currentAnswer.trim());
  const isLastQuestion = currentIndex >= questions.length - 1;
  const progressLabel = questions.length
    ? `Question ${currentIndex + 1} of ${questions.length}`
    : "Initializing session...";

  useEffect(() => {
    let isMounted = true;

    async function loadQuestions() {
      const loadedQuestions = await getInterviewQuestions(token);

      if (isMounted) {
        setQuestions(loadedQuestions);
        setCurrentIndex(0);
        setIsLoading(false);
      }
    }

    loadQuestions();

    return () => {
      isMounted = false;

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [token]);

  useEffect(() => {
    if (!isLoading && questions[currentIndex]) {
      speakQuestion(questions[currentIndex]);
    }
  }, [currentIndex, isLoading, questions]);

  useEffect(() => {
    let isMounted = true;

    async function startCameraPreview() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        if (isMounted) {
          setCameraState("Unavailable");
          setCameraError("Camera preview is unsupported in the current environment.");
        }
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = mediaStream;
        setCameraState("Live");
        setCameraError("");
      } catch (cameraIssue) {
        if (!isMounted) {
          return;
        }

        setCameraState("Blocked");
        setCameraError("Camera access denied. Please verify browser permissions.");
      }
    }

    startCameraPreview();

    return () => {
      isMounted = false;

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !mediaStreamRef.current) {
      return;
    }

    videoRef.current.srcObject = mediaStreamRef.current;
    videoRef.current
      .play()
      .catch(() => {});
  }, [cameraState]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  function updateAnswer(answerText, questionIndex = currentIndexRef.current) {
    setAnswers((previousAnswers) => {
      const nextAnswers = [...previousAnswers];
      nextAnswers[questionIndex] = {
        question: questions[questionIndex] ?? currentQuestionRef.current,
        answer: answerText,
      };
      return nextAnswers;
    });
  }

  function startRecording() {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setError("Speech recognition is unsupported in the current environment.");
      return;
    }

    if (!currentQuestion) {
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setError("");
      setVoiceState("Listening");
      setTranscript("");
      updateAnswer("", currentIndexRef.current);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const nextTranscript = (finalTranscript || interimTranscript).trim();

      if (nextTranscript) {
        setTranscript(nextTranscript);
      }

      if (finalTranscript.trim()) {
        const normalizedFinal = finalTranscript.trim();
        setTranscript(normalizedFinal);
        updateAnswer(normalizedFinal, currentIndexRef.current);
      }
    };

    recognition.onerror = () => {
      setVoiceState("Idle");
      setError("Audio capture failed. Please retry.");
    };

    recognition.onend = () => {
      const activeIndex = currentIndexRef.current;
      const latestTranscript = transcriptRef.current.trim();
      const latestAnswer = answersRef.current[activeIndex]?.answer?.trim() ?? "";
      const resolvedAnswer = latestAnswer || latestTranscript;

      if (resolvedAnswer) {
        setTranscript(resolvedAnswer);
        updateAnswer(resolvedAnswer, activeIndex);
      }

      setVoiceState((previousState) => {
        if (previousState === "Listening") {
          return resolvedAnswer ? "Done" : "Idle";
        }

        if (previousState === "Processing") {
          return resolvedAnswer ? "Done" : "Idle";
        }

        return previousState;
      });
    };

    recognition.onspeechend = () => {
      setVoiceState("Processing");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    if (!recognitionRef.current) {
      return;
    }

    setVoiceState("Processing");
    recognitionRef.current.stop();
  }

  function goToNextQuestion() {
    if (!hasCapturedAnswer || isLastQuestion) {
      return;
    }

    setTranscript("");
    setError("");
    setVoiceState("Idle");
    setCurrentIndex((previousIndex) => previousIndex + 1);
  }

  async function handleSubmitInterview() {
    if (!hasCapturedAnswer || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await submitInterview(token, answersRef.current);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(INTERVIEW_RESULT_STORAGE_KEY, JSON.stringify(result));
      }

      navigate(`/result/${token}`);
    } catch (submitError) {
      setError("Failed to submit interview data.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  function repeatQuestion() {
    setError("");
    speakQuestion(currentQuestion);
  }

  if (!token) {
    return (
      <main className="page-shell">
        <section className="card">
          <p className="eyebrow">Interview</p>
          <h1>Missing Session</h1>
          <p className="muted">Invalid session: Authentication token is missing.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="interview-shell">
      <section className="interview-layout">
        <header className="question-card">
          <div className="question-header">
            <div>
              <p className="eyebrow">{progressLabel}</p>
              <h1>AI Interview Session</h1>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={repeatQuestion}
              disabled={!currentQuestion}
              aria-label="Repeat question"
            >
              SPK
            </button>
          </div>

          <p className="question-text">
            {isLoading ? "Retrieving interview questions..." : currentQuestion}
          </p>
        </header>

        <section className="interview-grid">
          <article className="voice-card">
            <div className="panel-title-row">
              <h2>Voice Answer</h2>
              <span className="status-pill">{voiceState}</span>
            </div>

            <div className="status-box">
              <span className="status-dot" />
              <p>
                {voiceState === "Listening" &&
                  "Recording in progress..."}
                {voiceState === "Processing" &&
                  "Processing audio transcript..."}
                {voiceState === "Done" &&
                  "Response recorded successfully."}
                {voiceState === "Idle" &&
                  "Ready. Click the microphone to begin recording."}
              </p>
            </div>

            <div className="transcript-box">
              <p className="transcript-label">Transcript Preview</p>
              <p
                className={
                  transcript || currentAnswer ? "transcript-text" : "transcript-empty"
                }
              >
              {transcript || currentAnswer || "No transcript available."}
              </p>
            </div>

            {error ? <p className="form-error interview-error">{error}</p> : null}
          </article>

          <aside className="video-card">
            <div className="panel-title-row">
              <h2>Video Preview</h2>
              <span className="video-badge">{cameraState}</span>
            </div>

            <div className="video-placeholder">
              {cameraState === "Live" ? (
                <video
                  ref={videoRef}
                  className="camera-feed"
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <div className="video-fallback">
                  <div className="video-orb" />
                  <p className="video-title">Candidate Camera Preview</p>
                  <p className="muted">
                    {cameraError || "Initializing camera feed..."}
                  </p>
                </div>
              )}
              <p className="token-chip">Session: {token}</p>
            </div>
          </aside>
        </section>

        <footer className="controls-card">
          <button
            className="secondary-button"
            type="button"
            onClick={voiceState === "Listening" ? stopRecording : startRecording}
            disabled={isLoading || voiceState === "Processing" || isSubmitting}
          >
            {voiceState === "Listening" ? "Mic Stop" : "Mic Start"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={repeatQuestion}
            disabled={!currentQuestion || isSubmitting}
          >
            Repeat Question
          </button>
          {isLastQuestion ? (
            <button
              className="primary-button control-submit-button"
              type="button"
              onClick={handleSubmitInterview}
              disabled={!hasCapturedAnswer || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Finish Interview"}
            </button>
          ) : (
            <button
              className="secondary-button"
              type="button"
              onClick={goToNextQuestion}
              disabled={!hasCapturedAnswer || isSubmitting}
            >
              Next Question
            </button>
          )}
          <button
            className="danger-button"
            type="button"
            onClick={() => navigate("/")}
            disabled={isSubmitting}
          >
            Exit Interview
          </button>
        </footer>
      </section>
    </main>
  );
}
