import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, MapPin, DollarSign, Clock, Users, Eye,
  Edit, Trash2, CheckCircle, XCircle, Loader, X,
} from "lucide-react";
import api from "../../services/api";

export default function MyJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    salary_min: "",
    salary_max: "",
    type: "full-time",
    status: "open",
  });
  const [updating, setUpdating] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/company/jobs");
      setJobs(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete job");
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: newStatus });
      setJobs(jobs.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update job status");
    }
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setEditForm({
      title: job.title,
      description: job.description,
      location: job.location || "",
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      type: job.type,
      status: job.status,
    });
  };

  const closeEditModal = () => {
    setEditingJob(null);
    setEditForm({
      title: "",
      description: "",
      location: "",
      salary_min: "",
      salary_max: "",
      type: "full-time",
      status: "open",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    setUpdating(true);
    try {
      await api.put(`/jobs/${editingJob.id}`, editForm);
      await fetchJobs();
      closeEditModal();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update job");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const formatSalary = (min, max) => {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
    return `${formatter.format(min)} – ${formatter.format(max)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[var(--bg-primary)] min-h-screen">

      {/* Header — stacks on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Posted Jobs</h1>
        </div>
        <button
          onClick={() => navigate("/company/post-job")}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Briefcase className="h-4 w-4" /> Post New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <Briefcase className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No jobs posted yet</p>
          <button
            onClick={() => navigate("/company/post-job")}
            className="mt-4 text-[var(--color-accent)] hover:underline"
          >
            Post your first job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 hover:shadow-md transition"
            >
              {/* Card inner: info on top, actions below on mobile; side-by-side on md+ */}
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      {job.title}
                    </h2>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        job.status === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {job.status === "open" ? "Active" : "Closed"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      {job.location || "Remote"}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                      <DollarSign className="h-4 w-4 flex-shrink-0" />
                      {formatSalary(job.salary_min, job.salary_max)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      {job.type}
                    </div>
                  </div>

                  <p className="text-[var(--text-primary)] mb-3 line-clamp-2 text-sm">
                    {job.description}
                  </p>

                  <div className="flex gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <Users className="h-4 w-4" />
                      <span>{job.applications_count || 0} applications</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <CheckCircle className="h-4 w-4" />
                      <span>{job.shortlisted_count || 0} shortlisted</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons — row on mobile, column on md+ */}
                <div className="flex flex-row md:flex-col gap-2 md:ml-4 flex-wrap md:flex-nowrap">
                  <button
                    onClick={() => handleToggleStatus(job.id, job.status)}
                    className={`p-2 rounded-lg transition ${
                      job.status === "open"
                        ? "text-yellow-600 hover:bg-yellow-50"
                        : "text-green-600 hover:bg-green-50"
                    }`}
                    title={job.status === "open" ? "Close Job" : "Reopen Job"}
                  >
                    {job.status === "open" ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(job)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Job"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Job"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal — top-aligned on mobile to clear the topbar, centered on sm+ */}
      {editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 pt-16 sm:pt-4 overflow-y-auto">
          <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Job</h2>
              <button
                onClick={closeEditModal}
                className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                    placeholder="Leave empty for remote"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium mb-1">Job Type *</label>
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium mb-1">Salary Min (INR) *</label>
                  <input
                    type="number"
                    name="salary_min"
                    value={editForm.salary_min}
                    onChange={handleEditChange}
                    required
                    step="1000"
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium mb-1">Salary Max (INR) *</label>
                  <input
                    type="number"
                    name="salary_max"
                    value={editForm.salary_max}
                    onChange={handleEditChange}
                    required
                    step="1000"
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  required
                  rows="5"
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg"
                >
                  <option value="open">Open (Active)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-full sm:w-auto px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full sm:w-auto px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}