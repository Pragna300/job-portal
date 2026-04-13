import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const statusStyles = {
  applied:     "bg-blue-100 text-blue-700",
  shortlisted: "bg-yellow-100 text-yellow-700",
  interview:   "bg-purple-100 text-purple-700",
  hired:       "bg-green-100 text-green-700",
  rejected:    "bg-red-100 text-red-700",
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const savedCount = (() => {
    try { return JSON.parse(localStorage.getItem("savedJobIds") || "[]").length; }
    catch { return 0; }
  })();

  useEffect(() => {
    api.get("/users/dashboard-stats")
      .then(res => setData(res.data))
      .catch(err => console.error("Dashboard fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get("/auth/notifications")
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotifications([]));
  }, []);

  const handleDeleteNotification = (id) => {
    api.delete(`/auth/notifications/${id}`)
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      })
      .catch((err) => console.error("Failed to delete notification:", err));
  };

  const parseNotificationMessage = (message) => {
    if (!message) return { text: "No details available" };
    if (typeof message === "object") return message;
    try {
      const parsed = JSON.parse(message);
      return typeof parsed === "object" && parsed !== null ? parsed : { text: String(message) };
    } catch {
      return { text: String(message) };
    }
  };

  const stats      = data?.stats  || { total_applied: 0, shortlisted: 0, interviews: 0, hired: 0 };
  const profile    = data?.profile || {};
  const recentApps = data?.recentApplications || [];

  const statCards = [
    { label: "Applied",     value: stats.total_applied, color: "text-blue-600",   bar: "bg-blue-500" },
    { label: "Shortlisted", value: stats.shortlisted,   color: "text-yellow-600", bar: "bg-yellow-500" },
    { label: "Interviews",  value: stats.interviews,    color: "text-purple-600", bar: "bg-purple-500" },
    { label: "Hired",       value: stats.hired,         color: "text-green-600",  bar: "bg-green-500" },
    { label: "Saved Jobs",  value: savedCount,          color: "text-[var(--color-primary)]", bar: "bg-gray-400" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-8 w-64 bg-[var(--bg-primary)] rounded animate-pulse" />
        {/* 2 cols on mobile, 3 on sm, 5 on lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--bg-primary)] rounded-xl animate-pulse border border-[var(--border-color)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12">

      {/* Header */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">
          Welcome back, {user?.name || profile.name || "Candidate"}!
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">
          Here's a snapshot of your job hunt activity.
        </p>
      </header>

      {/* Stat Cards — 2 cols mobile, 3 cols sm, 5 cols lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-[var(--bg-primary)] p-4 sm:p-5 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col gap-1"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {label}
            </p>
            <p className={`text-3xl sm:text-4xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Middle Row: Profile Card + Recent Applications */}
      {/* Stacked on mobile/tablet, side-by-side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile Card */}
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-primary)]">My Profile</h2>
            <Link
              to="/user/profile"
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
            >
              Edit →
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl sm:text-2xl font-bold shrink-0">
              {(profile.name || user?.name || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[var(--text-primary)] leading-tight truncate">
                {profile.name || user?.name}
              </p>
              <p className="text-sm text-[var(--text-secondary)] truncate">
                {profile.title || "No title set"}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                {profile.email || user?.email}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              About
            </p>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed line-clamp-3">
              {profile.bio || "No bio added yet. Edit your profile to add one."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Skills
            </p>
            {profile.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 6).map(s => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs rounded-full text-[var(--text-primary)]"
                  >
                    {s}
                  </span>
                ))}
                {profile.skills.length > 6 && (
                  <span className="text-xs text-[var(--text-secondary)]">
                    +{profile.skills.length - 6} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] italic">No skills listed.</p>
            )}
          </div>

          <div className="mt-auto pt-2 border-t border-[var(--border-color)]">
            {profile.resume_url ? (
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
              >
                View Resume ↗
              </a>
            ) : (
              <Link
                to="/user/profile"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--color-accent)]"
              >
                Upload resume →
              </Link>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col">
          <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-primary)]">Recent Applications</h2>
            <Link
              to="/user/applications"
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-3">
              <p className="text-[var(--text-secondary)]">No applications yet.</p>
              <Link
                to="/user/jobs"
                className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-bold rounded-lg hover:opacity-90 transition"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {recentApps.map(app => (
                <div
                  key={app.id}
                  className="p-4 flex items-start sm:items-center justify-between gap-3 hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] text-sm truncate">
                      {app.job_title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                      {app.company_name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {app.applied_at
                        ? new Date(app.applied_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full capitalize ${
                      statusStyles[app.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Funnel */}
      {stats.total_applied > 0 && (
        <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
          <h2 className="text-base font-bold text-[var(--color-primary)] mb-4">Application Funnel</h2>
          <div className="flex flex-col gap-3">
            {statCards.slice(0, 4).map(({ label, value, bar }) => (
              <div key={label} className="flex items-center gap-3 sm:gap-4">
                <span className="w-24 sm:w-28 text-xs sm:text-sm text-[var(--text-secondary)] font-medium shrink-0">
                  {label}
                </span>
                <div className="flex-1 bg-[var(--bg-secondary)] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${bar} h-2.5 rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, (value / stats.total_applied) * 100)}%` }}
                  />
                </div>
                <span className="w-6 text-sm font-bold text-[var(--text-primary)] text-right shrink-0">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <section className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--color-primary)]">Notifications</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Assessment and interview updates from recruiters.
          </p>
        </div>
        {notifications.length === 0 ? (
          <p className="p-5 text-sm text-[var(--text-secondary)]">No notifications yet.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-color)] relative">
            {notifications.map((n) => {
              const msg = parseNotificationMessage(n.message);
              return (
                <div key={n.id} className="p-4 sm:p-5 relative group">
                  <button 
                    onClick={() => handleDeleteNotification(n.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Notification"
                  >
                    ×
                  </button>
                  <p className="text-sm font-semibold text-[var(--text-primary)] pr-6">
                    {msg.title || msg.text || "Notification"}
                  </p>
                  {msg.text && msg.title && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{msg.text}</p>
                  )}
                  {msg.time_limit && (
                    <p className="text-xs text-orange-600 mt-2 font-semibold">Time limit: {msg.time_limit}</p>
                  )}
                  {msg.link && (
                    <a
                      href={msg.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[var(--color-accent)] hover:underline mt-2 inline-block"
                    >
                      Open Link ↗
                    </a>
                  )}
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}