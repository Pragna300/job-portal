import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, CheckCircle } from "lucide-react";
import api from "../../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email) {
      setError("Email cannot be empty.");
      return;
    }

    if (!form.newPassword) {
      setError("New Password cannot be empty.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/auth/reset-password", {
        email: form.email,
        newPassword: form.newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password. Ensure your email is correct.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      <div className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-2xl shadow-lg border border-[var(--border-color)]">
        
        <h2 className="text-2xl font-bold text-center mb-6">
          Reset Password
        </h2>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <p className="text-green-600 font-medium text-lg mb-2">Success!</p>
            <p className="text-[var(--text-secondary)]">
              Your password has been updated successfully. Please login using your new password.
            </p>
            <p className="text-[var(--text-secondary)] text-sm mt-4">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {error && (
              <div className="bg-red-50 text-red-500 border border-red-200 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="flex items-center border border-[var(--border-color)] rounded-lg px-3">
              <Mail size={18} className="text-[var(--text-secondary)]" />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-3 py-3 outline-none bg-transparent"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* New Password */}
            <div className="flex items-center border border-[var(--border-color)] rounded-lg px-3">
              <Lock size={18} className="text-[var(--text-secondary)]" />
              <input
                type="password"
                placeholder="New Password"
                className="w-full px-3 py-3 outline-none bg-transparent"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="flex items-center border border-[var(--border-color)] rounded-lg px-3">
              <Lock size={18} className="text-[var(--text-secondary)]" />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full px-3 py-3 outline-none bg-transparent"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            {/* Error Message if passwords don't match */}
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-red-500 text-sm mt-[-8px] text-center">
                Passwords do not match. Please try again.
              </p>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={isSubmitting || !form.newPassword || form.newPassword !== form.confirmPassword}
              className={`bg-[var(--color-primary)] text-white py-3 rounded-lg font-semibold transition-all ${(isSubmitting || !form.newPassword || form.newPassword !== form.confirmPassword) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {/* Footer */}
        {!success && (
          <p className="text-sm text-center mt-6 text-[var(--text-secondary)]">
            Remember your password?{" "}
            <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
              Back to Login
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}
