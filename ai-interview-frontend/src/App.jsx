import { Navigate, Route, Routes } from "react-router-dom";
import VerificationPage from "./pages/VerificationPage";
import InstructionsPage from "./pages/InstructionsPage";
import SystemCheckPage from "./pages/SystemCheckPage";
import InterviewPage from "./pages/InterviewPage";
import ResultPage from "./pages/ResultPage";
import CompletionPage from "./pages/CompletionPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<VerificationPage />} />
      <Route path="/instructions/:token" element={<InstructionsPage />} />
      <Route path="/system-check/:token" element={<SystemCheckPage />} />
      <Route path="/interview/:token" element={<InterviewPage />} />
      <Route path="/completion/:token" element={<CompletionPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/result/:token" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
