import { useState, useEffect } from "react";
import api from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return "Recently";
    const diffMs = new Date() - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl pb-12">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">Admin Overview</h1>
          <p className="text-[var(--text-secondary)] mt-2">Loading platform stats...</p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--bg-primary)] p-4 sm:p-6 rounded-xl border border-[var(--border-color)] animate-pulse h-24 sm:h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 text-center text-red-500 bg-red-50 rounded-xl">
        {error}
      </div>
    );
  }

  const activity = [
    ...(stats.recentJobs || []).map((job) => ({
      id: `job-${job.id}`,
      user: job.company_name,
      action: "posted a new job:",
      target: job.title,
      time: formatTime(job.created_at),
      type: "job",
    })),
    ...(stats.recentApplications || []).map((app) => ({
      id: `app-${app.id}`,
      user: app.candidate_name,
      action: "applied for",
      target: `${app.job_title} at ${app.company_name}`,
      time: formatTime(app.applied_at),
      type: "application",
    })),
  ];

  const statCards = [
    { label: "Total Candidates", value: stats.candidates, accent: false },
    { label: "Companies", value: stats.companies, accent: false },
    { label: "Active Jobs", value: stats.activeJobs, accent: true },
    { label: "Applications", value: stats.totalApplications, accent: false },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full max-w-6xl pb-12">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">Admin Overview</h1>
        <p className="text-[var(--text-secondary)] mt-1 sm:mt-2 text-sm sm:text-base">Monitor platform health and recent activities.</p>
      </header>

      {/* Stats grid — 2 cols on mobile, 4 on lg */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sm:gap-6">
        {statCards.map(({ label, value, accent }) => (
          <div
            key={label}
            className="bg-[var(--bg-primary)] p-4 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col gap-1 sm:gap-2"
          >
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] leading-tight">
              {label}
            </h3>
            <p className={`text-3xl sm:text-4xl font-black ${accent ? "text-[var(--color-accent)]" : "text-[var(--color-primary)]"}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      {/* Activity feed */}
      <section className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)]">Recent Activity</h2>
        </div>
        <div className="flex flex-col divide-y divide-[var(--border-color)]">
          {activity.length === 0 ? (
            <p className="p-4 sm:p-6 text-[var(--text-secondary)] italic text-sm">No recent activity.</p>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <p className="text-[var(--text-primary)] text-sm leading-relaxed">
                  <span className="font-bold text-[var(--color-primary)]">{item.user}</span>{" "}
                  <span className="text-[var(--text-secondary)]">{item.action}</span>{" "}
                  <span className="font-semibold">{item.target}</span>
                </p>
                <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border-color)] self-start sm:self-auto">
                  {item.time}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}