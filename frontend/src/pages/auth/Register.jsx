import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import api from "../../services/api";
import { mapFrontendToBackend } from "../../utils/roleMap";


export default function Register() {
  const navigate = useNavigate();

const [form, setForm] = useState({
  name: "",
  email: "",
  password: "",
  role: "user",
});


const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await api.post("/auth/register", {
      ...form,
      role: mapFrontendToBackend(form.role),
    });

    navigate("/login");
  } catch (err) {
    console.log(err);
    alert("Registration failed");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      
      <div className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-2xl shadow-lg border border-[var(--border-color)]">
        
        <h2 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name */}
          <div className="flex items-center border border-[var(--border-color)] rounded-lg px-3">
            <User size={18} className="text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-3 py-3 outline-none bg-transparent"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

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

          <select
          className="border border-[var(--border-color)] rounded-lg px-3 py-3 bg-transparent"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="user">User</option>
          <option value="company">Company</option>
        </select>

          {/* Button */}
          <button
            type="submit"
            className="bg-[var(--color-primary)] text-white py-3 rounded-lg font-semibold hover:opacity-90"
          >
            Register
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center mt-6 text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link to="/login" className="text-[var(--color-primary)] font-medium">
            Login
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