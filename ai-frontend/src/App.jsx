import { Navigate, Route, Routes } from "react-router-dom";
import VerificationPage from "./pages/VerificationPage";
import InterviewPage from "./pages/InterviewPage";
import ResultPage from "./pages/ResultPage";

import InstructionsPage from "./pages/InstructionsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<VerificationPage />} />
      <Route path="/instructions/:token" element={<InstructionsPage />} />
      <Route path="/interview/:token" element={<InterviewPage />} />
      <Route path="/result/:token" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
