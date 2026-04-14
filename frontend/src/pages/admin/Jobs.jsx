import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function Jobs() {
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get("/admin/jobs");
        setJobList(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleToggleStatus = async (id, currentTakenDown) => {
    const newTakenDown = !currentTakenDown;
    try {
      await api.put(`/admin/jobs/${id}/status`, { is_taken_down: newTakenDown });
      setJobList((prev) =>
        prev.map((job) => (job.id === id ? { ...job, is_taken_down: newTakenDown } : job))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update job status");
    }
  };

  const filteredJobs = jobList.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (job) => {
    if (job.is_taken_down) return { label: "Taken Down", cls: "bg-red-500/10 text-red-500 border-red-500/20" };
    if (job.status === "open") return { label: "Active", cls: "bg-green-500/10 text-green-500 border-green-500/20" };
    return { label: "Closed", cls: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl pb-12">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">Global Job Feed</h1>
        </header>
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-6 sm:p-8 text-center animate-pulse text-[var(--text-secondary)]">
          Loading jobs...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 sm:p-8 text-center text-red-500 bg-red-50 rounded-xl">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full max-w-7xl pb-12">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">Global Job Feed</h1>
          <p className="text-[var(--text-secondary)] mt-1 sm:mt-2 text-sm sm:text-base">Moderate active job postings across all companies.</p>
        </div>
        <input
          type="text"
          placeholder="Search by job title or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-80 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] shadow-sm transition-colors text-sm"
        />
      </header>

      {/* Mobile & Tablet: Card list */}
      <section className="flex flex-col gap-3 md:hidden">
        {filteredJobs.length === 0 ? (
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-6 text-center text-[var(--text-secondary)] italic text-sm">
            No jobs found matching your criteria.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const badge = getStatusBadge(job);
            return (
              <div key={job.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm p-4">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--color-primary)] truncate">{job.title}</div>
                    <div className="text-sm font-medium text-[var(--text-secondary)] mt-0.5">{job.company_name}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 text-xs text-[var(--text-secondary)]">
                  <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    {job.location || "Remote"}
                  </span>
                  <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] capitalize">
                    {job.type}
                  </span>
                  <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    {job.applicant_count ?? 0} applicants
                  </span>
                </div>

                <div className="flex gap-3 pt-3 mt-3 border-t border-[var(--border-color)]">
                  <Link
                    to={`/admin/jobs/${job.id}`}
                    className="flex-1 text-sm font-semibold text-center py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(job.id, job.is_taken_down)}
                    className={`flex-1 text-sm font-semibold text-center py-2 rounded-lg border transition-colors ${
                      job.is_taken_down
                        ? "border-green-300 text-green-500 hover:bg-green-500 hover:text-white"
                        : "border-red-300 text-red-400 hover:bg-red-500 hover:text-white"
                    }`}
                  >
                    {job.is_taken_down ? "Restore" : "Takedown"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Desktop: Table */}
      <section className="hidden md:block bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm uppercase tracking-wider">
              <th className="p-3 sm:p-4 font-semibold">Job Title & Company</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Location</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Type</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Applicants</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Status</th>
              <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 sm:p-8 text-center text-[var(--text-secondary)] italic">
                  No jobs found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => {
                const badge = getStatusBadge(job);
                return (
                  <tr key={job.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="font-bold text-[var(--color-primary)]">{job.title}</div>
                      <div className="text-sm font-medium text-[var(--text-secondary)] mt-1">{job.company_name}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-center text-[var(--text-secondary)] font-medium">{job.location || "Remote"}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-semibold rounded-full border border-[var(--border-color)] capitalize">
                        {job.type}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center font-bold text-[var(--text-primary)]">{job.applicant_count ?? 0}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex justify-end gap-4 items-center">
                        <Link
                          to={`/admin/jobs/${job.id}`}
                          className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(job.id, job.is_taken_down)}
                          className={`text-sm font-semibold transition-colors ${
                            job.is_taken_down
                              ? "text-green-500 hover:text-green-600"
                              : "text-[var(--text-secondary)] hover:text-red-500"
                          }`}
                        >
                          {job.is_taken_down ? "Restore" : "Takedown"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}