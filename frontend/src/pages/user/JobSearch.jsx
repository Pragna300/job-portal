import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function JobSearch() {
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/jobs");
        const enriched = res.data.map((job) => ({
          ...job,
          company: job.company_name || "Unknown Company",
          posted: getTimeAgo(job.created_at),
          displayLocation: job.location || "Remote",
        }));
        setJobs(enriched);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently";
    const diffDays = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  useEffect(() => {
    const stored = localStorage.getItem("savedJobIds");
    if (stored) setSavedJobIds(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("savedJobIds", JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  const handleTypeChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.type);
    return matchesSearch && matchesType;
  });

  const jobTypeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "remote", label: "Remote" },
  ];

  if (loading) return <div className="p-8 text-center">Loading jobs...</div>;
  if (error)   return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">
          Find your next job
        </h1>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by job title or company..."
          className="w-full p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] shadow-sm transition-colors"
        />
      </header>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-2">

        {/* Filters — collapsible on mobile, sticky sidebar on desktop */}
        <aside className="w-full lg:w-64 lg:sticky lg:top-6 lg:self-start">
          {/* Mobile toggle */}
          <button
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-primary)] mb-2"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <span>Filters {selectedTypes.length > 0 ? `(${selectedTypes.length} active)` : ""}</span>
            <span>{filtersOpen ? "▲" : "▼"}</span>
          </button>

          <div className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider text-sm">
                Filters
              </h3>
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Job Type</h4>
                {/* On mobile show checkboxes in a row; column on desktop */}
                <div className="flex flex-row flex-wrap lg:flex-col gap-3 lg:gap-3">
                  {jobTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 text-[var(--text-primary)] cursor-pointer hover:text-[var(--color-accent)] transition-colors text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(option.value)}
                        onChange={() => handleTypeChange(option.value)}
                        className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer flex-shrink-0"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Job Feed */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
          </p>

          {filteredJobs.length === 0 && (
            <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-xl">
              No jobs found matching your criteria.
            </div>
          )}

          {filteredJobs.map((job) => (
            <Link to={`/user/jobs/${job.id}`} key={job.id} className="block group">
              <div className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm group-hover:shadow-md group-hover:border-[var(--color-accent)] transition-all flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                    {job.title}
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-1 text-sm">
                    {job.company} &bull; {job.displayLocation}
                  </p>
                  {job.salary_min && job.salary_max && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency", currency: "INR", maximumFractionDigits: 0,
                      }).format(job.salary_min)}{" "}
                      –{" "}
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency", currency: "INR", maximumFractionDigits: 0,
                      }).format(job.salary_max)}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-semibold rounded-full border border-[var(--border-color)] capitalize">
                      {job.type}
                    </span>
                    <span className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-semibold rounded-full border border-[var(--border-color)]">
                      {job.posted}
                    </span>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex sm:flex-col justify-end items-end gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setSavedJobIds((prev) =>
                        prev.includes(job.id)
                          ? prev.filter((sid) => sid !== job.id)
                          : [...prev, job.id]
                      );
                    }}
                    className="p-2 text-xl hover:scale-110 transition-transform"
                    title={savedJobIds.includes(job.id) ? "Unsave" : "Save"}
                    aria-label={savedJobIds.includes(job.id) ? "Unsave job" : "Save job"}
                  >
                    {savedJobIds.includes(job.id) ? "♥" : "♡"}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </main>
      </div>
    </div>
  );
}