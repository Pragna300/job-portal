import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Mail, Lock } from "lucide-react";
import api from "../../services/api";
import { mapFrontendToBackend, mapBackendToFrontend } from "../../utils/roleMap";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "user",
  });



const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await api.post("/auth/login", {
      email: form.email,
      password: form.password,
      role: mapFrontendToBackend(form.role),
    });

    const { user, token } = res.data;

    login(
      {
        ...user,
        role: mapBackendToFrontend(user.role),
      },
      token
    );

    navigate("/redirect");
  } catch (err) {
    console.log(err);
    alert("Invalid credentials");
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      
      <div className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-2xl shadow-lg border border-[var(--border-color)]">
        
        <h2 className="text-2xl font-bold text-center mb-6">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Email */}
          <div className="flex items-center border border-[var(--border-color)] rounded-lg px-3">
            <Mail size={18} className="text-[var(--text-secondary)]" />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-3 outline-none bg-transparent"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center border border-[var(--border-color)] rounded-lg px-3">
            <Lock size={18} className="text-[var(--text-secondary)]" />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-3 outline-none bg-transparent"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {/* Role Select (for demo) */}
          <select
            className="border border-[var(--border-color)] rounded-lg px-3 py-3 bg-transparent"
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>

          {/* Button */}
          <button
            type="submit"
            className="bg-[var(--color-primary)] text-white py-3 rounded-lg font-semibold hover:opacity-90"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center mt-6 text-[var(--text-secondary)]">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[var(--color-primary)] font-medium">
            Register
          </Link>
        </p>

        <Link to="/legal/terms" className="text-sm text-center mt-2 block text-[var(--text-secondary)] hover:underline">
          Terms and Conditions
        </Link> 
        <Link to="/legal/privacy" className="text-sm text-center mt-2 block text-[var(--text-secondary)] hover:underline">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}