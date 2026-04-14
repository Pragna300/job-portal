import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    if (user.role === "admin") return <Navigate to="/admin" />;
    if (user.role === "company") return <Navigate to="/company" />;
    return <Navigate to="/" />;
  }

  return children;
}