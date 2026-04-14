import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, UserCheck, UserPlus, Clock, PlusCircle, Bell, Eye } from "lucide-react";
import api from "../../services/api";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/company/dashboard-stats");
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statusBadge = (status) => {
    const styles = {
      applied: "bg-blue-100 text-blue-800",
      shortlisted: "bg-yellow-100 text-yellow-800",
      hired: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      interview: "bg-purple-100 text-purple-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 bg-[var(--bg-primary)] min-h-screen">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-secondary)] p-4 rounded-lg animate-pulse h-24 border border-[var(--border-color)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">{error}</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[var(--bg-primary)] min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">
            Welcome back, {data.company?.name || "Company"}
          </p>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stat cards — 2 cols on mobile/tablet, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Jobs", value: data.totalJobs, Icon: Briefcase },
          { label: "Applications", value: data.totalApplications, Icon: Users },
          { label: "Shortlisted", value: data.shortlisted, Icon: UserCheck },
          { label: "Hired", value: data.hired, Icon: UserPlus },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm border border-[var(--border-color)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{value}</p>
              </div>
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-accent)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications table */}
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-color)]">
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Applications</h2>
          <button
            onClick={() => navigate("/company/applicants")}
            className="text-sm text-[var(--color-accent)] hover:underline flex items-center gap-1"
          >
            View all <Eye className="h-4 w-4" />
          </button>
        </div>
        {/* Horizontal scroll wrapper so table never breaks layout on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-[var(--bg-primary)]">
              <tr className="text-left text-[var(--text-secondary)] text-sm">
                <th className="p-4">Candidate</th>
                <th className="p-4">Job</th>
                <th className="p-4 hidden sm:table-cell">Applied Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentApplications?.length > 0 ? (
                data.recentApplications.map((app) => (
                  <tr key={app.id} className="border-t border-[var(--border-color)]">
                    <td className="p-4">
                      <p className="font-medium text-[var(--text-primary)]">{app.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{app.email}</p>
                    </td>
                    <td className="p-4 text-[var(--text-primary)] text-sm">{app.job_title}</td>
                    <td className="p-4 text-[var(--text-secondary)] text-sm hidden sm:table-cell">
                      {app.applied_at
                        ? new Date(app.applied_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge(app.status)}`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-[var(--text-secondary)]">
                    No applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-color)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pending Actions</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Applications need review</span>
              <span className="font-bold text-[var(--text-primary)]">{data.pendingReviews}</span>
            </div>
            <button
              onClick={() => navigate("/company/applicants")}
              className="w-full mt-2 bg-[var(--color-primary)] text-white py-2 rounded-lg hover:opacity-90 transition"
            >
              Review Applications
            </button>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-color)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/company/post-job")}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-2 rounded-lg hover:opacity-90 transition"
            >
              <PlusCircle className="h-4 w-4" /> Post New Job
            </button>
            <button
              onClick={() => navigate("/company/jobs")}
              className="w-full flex items-center justify-center gap-2 border border-[var(--border-color)] text-[var(--text-primary)] py-2 rounded-lg hover:bg-[var(--bg-primary)] transition"
            >
              <Briefcase className="h-4 w-4" /> Manage Jobs
            </button>
            <button
              onClick={() => navigate("/company/applicants")}
              className="w-full flex items-center justify-center gap-2 border border-[var(--border-color)] text-[var(--text-primary)] py-2 rounded-lg hover:bg-[var(--bg-primary)] transition"
            >
              <Users className="h-4 w-4" /> View All Applicants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;