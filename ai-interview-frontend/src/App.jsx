import { Navigate, Route, Routes } from "react-router-dom";
import VerificationPage from "./pages/VerificationPage";
import InterviewPage from "./pages/InterviewPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<VerificationPage />} />
      <Route path="/interview" element={<VerificationPage />} />
      <Route path="/interview/:token" element={<InterviewPage />} />
      <Route path="/result/:token" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
