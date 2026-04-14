import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const stored = localStorage.getItem("savedJobIds");
        const savedIds = stored ? JSON.parse(stored) : [];

        if (savedIds.length === 0) {
          setSavedJobs([]);
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          savedIds.map(async (id) => {
            try {
              const res = await api.get(`/jobs/${id}`);
              return {
                ...res.data,
                company: res.data.company_name || "Unknown Company",
                displayLocation: res.data.location || "Remote",
                savedOn: new Date().toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric",
                }),
              };
            } catch {
              return null;
            }
          })
        );

        setSavedJobs(results.filter(Boolean));
      } catch (err) {
        console.error("Failed to load saved jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, []);

  const handleRemove = (id) => {
    setSavedJobs((prev) => prev.filter((job) => job.id !== id));
    const stored = localStorage.getItem("savedJobIds");
    const savedIds = stored ? JSON.parse(stored) : [];
    localStorage.setItem(
      "savedJobIds",
      JSON.stringify(savedIds.filter((sid) => sid !== id))
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 h-full">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">
            Saved Jobs
          </h1>
        </header>
        <div className="p-8 text-center text-[var(--text-secondary)] animate-pulse">
          Loading saved jobs...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">
          Saved Jobs
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
          Review and apply to the jobs you've bookmarked.
        </p>
      </header>

      <main className="flex flex-col gap-4 max-w-4xl">
        {savedJobs.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-xl">
            You haven't saved any jobs yet. Browse jobs and click ♡ to save them here.
          </div>
        ) : (
          savedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col sm:flex-row justify-between gap-4 group"
            >
              {/* Job info */}
              <Link to={`/user/jobs/${job.id}`} className="flex-1 min-w-0 block cursor-pointer">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                  {job.title}
                </h2>
                <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm truncate">
                  {job.company} &bull; {job.displayLocation}
                </p>
                <div className="flex flex-wrap gap-2 mt-4 items-center">
                  <span className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-semibold rounded-full border border-[var(--border-color)] capitalize">
                    {job.type}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Saved: {job.savedOn}
                  </span>
                </div>
              </Link>

              {/* Actions — row on mobile (below info), column on sm+ (beside info) */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 sm:border-l border-[var(--border-color)] pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0 flex-shrink-0">
                <Link to={`/user/apply/${job.id}`}>
                  <button className="px-5 py-2 bg-[var(--color-primary)] text-white text-sm font-bold rounded-lg hover:bg-[var(--color-secondary)] transition-colors shadow-sm">
                    Apply
                  </button>
                </Link>
                <button
                  onClick={() => handleRemove(job.id)}
                  className="text-[var(--text-secondary)] text-sm font-semibold hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}