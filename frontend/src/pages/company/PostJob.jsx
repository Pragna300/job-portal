import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, DollarSign, Clock, FileText } from "lucide-react";
import api from "../../services/api";

export default function PostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState(null);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    salary_min: "",
    salary_max: "",
    type: "full-time",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get("/company/my-company");
        setCompany(res.data);
      } catch (err) {
        setError("Unable to fetch your company information. Please try again.");
      } finally {
        setFetching(false);
      }
    };
    fetchCompany();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const salaryMin = parseFloat(formData.salary_min);
    const salaryMax = parseFloat(formData.salary_max);

    if (
      isNaN(salaryMin) || isNaN(salaryMax) ||
      salaryMin < 0 || salaryMax < 0 ||
      salaryMin > salaryMax
    ) {
      setError("Please enter a valid salary range (min ≤ max).");
      setLoading(false);
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      salary_min: salaryMin,
      salary_max: salaryMax,
      location: formData.location.trim() || null,
      type: formData.type,
    };

    try {
      await api.post("/jobs", payload);
      navigate("/company/jobs");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)]">
        Loading company information...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="h-6 w-6 text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Post a New Job</h1>
        </div>

        {company && (
          <div className="mb-6 bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Posting for: </span>
            <span className="font-semibold text-[var(--text-primary)]">{company.name}</span>
            {!company.approved && (
              <p className="text-xs text-amber-600 mt-1">
                Note: Your company is pending approval. Jobs will be visible once approved.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder="e.g., Frontend Developer"
            />
          </div>

          {/* Location + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  placeholder="e.g., Hyderabad (leave empty for remote)"
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Leave empty if remote.</p>
            </div>

            <div className="min-w-0">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Job Type *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Salary Min (INR) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleChange}
                  required
                  step="1000"
                  min="0"
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  placeholder="e.g., 50000"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Salary Max (INR) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleChange}
                  required
                  step="1000"
                  min="0"
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  placeholder="e.g., 110000"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Job Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-[var(--text-secondary)]" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>
          </div>

          {/* Buttons — stack on mobile, row on sm+ */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/company/jobs")}
              className="w-full sm:w-auto px-6 py-2 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}