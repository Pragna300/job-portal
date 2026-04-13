import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";

export default function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cover_letter: "",
    college_name: "",
    cgpa: "",
    willing_to_relocate: false,
    experience_years: "0",
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if already applied on mount
  useEffect(() => {
    api.get("/applications/my")
      .then(res => {
        const applied = res.data.some(app => String(app.job_id) === String(id));
        setAlreadyApplied(applied);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) { setError("Please upload your resume."); return; }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("job_id", id);
    formData.append("cover_letter", form.cover_letter);
    formData.append("college_name", form.college_name);
    formData.append("cgpa", form.cgpa);
    formData.append("willing_to_relocate", form.willing_to_relocate);
    formData.append("experience_years", form.experience_years);
    formData.append("resume", resume);

    try {
      await api.post("/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      setTimeout(() => navigate("/user/applications"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Checking application status...</div>;
  }

  if (alreadyApplied) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] mt-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Already Applied</h2>
        <p className="text-[var(--text-secondary)] mb-6">You've already submitted an application for this job.</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate("/user/applications")} className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90">
            View My Applications
          </button>
          <button onClick={() => navigate(-1)} className="px-6 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-primary)] p-8 rounded-xl border border-[var(--border-color)] mt-4">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-1">Apply for Job</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Fill in the details below to submit your application.</p>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg font-medium">
          Application submitted successfully! Redirecting...
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Resume */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
            Resume <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={e => setResume(e.target.files[0])}
            required
            className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:opacity-90 cursor-pointer"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">PDF, DOC or DOCX (max 5 MB)</p>
        </div>

        {/* College Name */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">College / University</label>
          <input
            type="text"
            name="college_name"
            value={form.college_name}
            onChange={handleChange}
            placeholder="e.g. IIT Hyderabad"
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* CGPA + Experience row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">CGPA / Percentage</label>
            <input
              type="number"
              name="cgpa"
              value={form.cgpa}
              onChange={handleChange}
              placeholder="e.g. 8.5"
              min="0"
              max="10"
              step="0.01"
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Out of 10 (or enter % if applicable)</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Years of Experience</label>
            <select
              name="experience_years"
              value={form.experience_years}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="0">Fresher (0 years)</option>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="4">4 years</option>
              <option value="5">5+ years</option>
            </select>
          </div>
        </div>

        {/* Willing to Relocate */}
        <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3">
          <input
            type="checkbox"
            id="willing_to_relocate"
            name="willing_to_relocate"
            checked={form.willing_to_relocate}
            onChange={handleChange}
            className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
          />
          <label htmlFor="willing_to_relocate" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none">
            I am willing to relocate for this position
          </label>
        </div>

        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Cover Letter <span className="text-[var(--text-secondary)] font-normal">(optional)</span></label>
          <textarea
            name="cover_letter"
            rows="4"
            placeholder="Tell us why you're a great fit for this role..."
            value={form.cover_letter}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
