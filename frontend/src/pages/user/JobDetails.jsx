import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [isSaved, setIsSaved]     = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/jobs/${id}`);
        const jobData = response.data;

        let salaryDisplay = "Not specified";
        const fmt = new Intl.NumberFormat("en-IN", {
          style: "currency", currency: "INR", maximumFractionDigits: 0,
        });
        if (jobData.salary_min && jobData.salary_max) {
          salaryDisplay = `${fmt.format(jobData.salary_min)} – ${fmt.format(jobData.salary_max)}`;
        } else if (jobData.salary_min) {
          salaryDisplay = `From ${fmt.format(jobData.salary_min)}`;
        } else if (jobData.salary_max) {
          salaryDisplay = `Up to ${fmt.format(jobData.salary_max)}`;
        }

        const displayLocation = jobData.location || "Remote";
        const displayType = jobData.type
          ? jobData.type.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "Not specified";

        setJob({
          ...jobData,
          salaryDisplay,
          displayLocation,
          displayType,
          company: jobData.company_name || "Unknown Company",
        });
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Job not found or server error.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [id]);

  useEffect(() => {
    if (!job) return;
    const stored = localStorage.getItem("savedJobIds");
    if (stored) {
      const savedIds = JSON.parse(stored);
      setIsSaved(savedIds.includes(job.id));
    }
  }, [job]);

  useEffect(() => {
    if (!job || user?.role !== "user") return;
    api.get("/applications/my")
      .then(res => {
        const applied = res.data.some(app => String(app.job_id) === String(job.id));
        setHasApplied(applied);
      })
      .catch(() => {});
  }, [job, user]);

  const handleSaveToggle = () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    const stored = localStorage.getItem("savedJobIds");
    let savedIds = stored ? JSON.parse(stored) : [];
    if (newSaved) {
      if (!savedIds.includes(job.id)) savedIds.push(job.id);
    } else {
      savedIds = savedIds.filter((sid) => sid !== job.id);
    }
    localStorage.setItem("savedJobIds", JSON.stringify(savedIds));
  };

  const handleAdminToggleTakedown = async () => {
    try {
      const newTakenDown = !job.is_taken_down;
      await api.put(`/admin/jobs/${job.id}/status`, { is_taken_down: newTakenDown });
      setJob({ ...job, is_taken_down: newTakenDown });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update job status");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading job details...</div>;
  if (error || !job) return <div className="p-8 text-center text-red-500">{error || "Job not found."}</div>;

  const backTo = user?.role === "admin" ? "/admin/jobs" : "/user/jobs";

  // Action card — extracted so we can render it in two places
  const ActionCard = () => (
    <div className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col gap-6">
      {/* Job meta */}
      <div className="flex flex-col gap-3 text-[var(--text-primary)]">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 gap-4">
          <span className="text-[var(--text-secondary)] font-medium text-sm">Location</span>
          <span className="font-semibold text-sm text-right">{job.displayLocation}</span>
        </div>
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 gap-4">
          <span className="text-[var(--text-secondary)] font-medium text-sm">Job Type</span>
          <span className="font-semibold text-sm text-right">{job.displayType}</span>
        </div>
        <div className="flex justify-between items-center pb-3 gap-4">
          <span className="text-[var(--text-secondary)] font-medium text-sm">Salary</span>
          <span className="font-semibold text-sm text-right text-[var(--color-accent)]">
            {job.salaryDisplay}
          </span>
        </div>
      </div>

      {/* Actions */}
      {user?.role === "admin" ? (
        <button
          onClick={handleAdminToggleTakedown}
          className={`w-full py-3 sm:py-4 font-bold rounded-xl shadow-sm text-base sm:text-lg transition-colors border ${
            job.is_taken_down
              ? "bg-[var(--bg-primary)] text-green-500 border-green-500 hover:bg-green-500/10"
              : "bg-[var(--bg-primary)] text-red-500 border-red-500 hover:bg-red-500/10"
          }`}
        >
          {job.is_taken_down ? "Restore Job" : "Takedown Job"}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={() =>
              !hasApplied &&
              !job.is_taken_down &&
              job.status !== "closed" &&
              navigate(`/user/apply/${job.id}`)
            }
            disabled={hasApplied || job.is_taken_down || job.status === "closed"}
            className={`w-full py-3 sm:py-4 font-bold rounded-xl shadow-sm text-base sm:text-lg transition-colors ${
              hasApplied
                ? "bg-green-100 text-green-600 border border-green-300 cursor-not-allowed opacity-70"
                : job.is_taken_down || job.status === "closed"
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)]"
            }`}
          >
            {hasApplied
              ? "Already Applied ✓"
              : job.is_taken_down
              ? "Job Unavailable"
              : job.status === "closed"
              ? "Position Closed"
              : "Apply Now"}
          </button>
          <button
            onClick={handleSaveToggle}
            className={`w-full py-3 font-bold rounded-xl shadow-sm transition-colors border ${
              isSaved
                ? "bg-[var(--bg-secondary)] text-[var(--color-accent)] border-[var(--color-accent)]"
                : "bg-[var(--bg-primary)] text-[var(--color-primary)] border-[var(--border-color)] hover:border-[var(--color-primary)]"
            }`}
          >
            {isSaved ? "Saved ♥" : "Save Job ♡"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div>
        <Link
          to={backTo}
          className="text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors text-sm font-semibold flex items-center gap-2"
        >
          &larr; Back to jobs
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* Left: Job Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 sm:gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-primary)] tracking-tight">
              {job.title}
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] font-medium">
              {job.company}
            </p>
            {job.is_taken_down && (
              <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full w-fit">
                Taken Down by Admin
              </span>
            )}
          </header>

          {/* Action card inline on mobile — before description */}
          <div className="lg:hidden">
            <ActionCard />
          </div>

          <section className="bg-[var(--bg-primary)] p-5 sm:p-8 rounded-xl border border-[var(--border-color)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-primary)] mb-4">
              Job Description
            </h2>
            <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {job.description}
            </p>
          </section>
        </div>

        {/* Right: Action card — desktop sidebar only */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-8">
            <ActionCard />
          </div>
        </aside>
      </div>
    </div>
  );
}