import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [searchTerm, setSearchTerm]     = useState("");

  const statusMap = {
    applied:     "Applied",
    shortlisted: "Under Review",
    interview:   "Interviewing",
    rejected:    "Rejected",
    hired:       "Hired",
  };

  const stages = ["Applied", "Under Review", "Interviewing", "Rejected", "Hired"];

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await api.get("/applications/my");
        const apps = response.data;

        if (apps.length === 0) {
          setApplications([]);
          return;
        }

        const enrichedApps = await Promise.all(
          apps.map(async (app) => {
            try {
              const jobRes = await api.get(`/jobs/${app.job_id}`);
              const job = jobRes.data;
              return {
                id: app.id,
                jobId: app.job_id,
                title: job.title,
                company: job.company_name || "Unknown Company",
                status: statusMap[app.status] || "Applied",
                date: app.created_at
                  ? new Date(app.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })
                  : "Unknown date",
              };
            } catch (err) {
              return {
                id: app.id,
                jobId: app.job_id,
                title: "Unknown Job",
                company: "Unknown Company",
                status: statusMap[app.status] || "Applied",
                date: "Unknown date",
              };
            }
          })
        );

        setApplications(enrichedApps);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(
    (app) =>
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[var(--text-secondary)]">Loading your applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">{error}</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">
            My Applications
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
            Track the status of the jobs you've applied for.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] shadow-sm transition-colors"
        />
      </header>

      {filteredApplications.length === 0 && !loading && (
        <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-xl">
          No applications found.
        </div>
      )}

      {/*
        Kanban layout:
        - Mobile (< md):  single column list, each stage is a collapsible section
        - Tablet (md):    2-column grid
        - Desktop (xl):   5-column grid (all stages side by side)
      */}

      {/* Mobile: stacked accordion-style stages */}
      <div className="flex flex-col gap-4 md:hidden">
        {stages.map((stage) => {
          const stageApps = filteredApplications.filter((app) => app.status === stage);
          return (
            <details key={stage} className="group" open={stageApps.length > 0}>
              <summary className="flex items-center justify-between border-b-2 border-[var(--border-color)] pb-2 cursor-pointer list-none">
                <h2 className="font-bold text-[var(--text-primary)]">{stage}</h2>
                <div className="flex items-center gap-2">
                  <span className="bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs font-bold px-2 py-1 rounded-full border border-[var(--border-color)]">
                    {stageApps.length}
                  </span>
                  <span className="text-[var(--text-secondary)] text-xs group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>
              <div className="flex flex-col gap-3 mt-3">
                {stageApps.length === 0 ? (
                  <div className="p-4 text-sm text-[var(--text-secondary)] text-center italic border border-dashed border-[var(--border-color)] rounded-xl">
                    No applications here.
                  </div>
                ) : (
                  stageApps.map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))
                )}
              </div>
            </details>
          );
        })}
      </div>

      {/* Tablet: 2-col grid */}
      <div className="hidden md:grid xl:hidden grid-cols-2 gap-6 items-start pb-8">
        {stages.map((stage) => {
          const stageApps = filteredApplications.filter((app) => app.status === stage);
          return (
            <KanbanColumn key={stage} stage={stage} apps={stageApps} />
          );
        })}
      </div>

      {/* Desktop: all 5 columns */}
      <div className="hidden xl:grid grid-cols-5 gap-4 items-start pb-8">
        {stages.map((stage) => {
          const stageApps = filteredApplications.filter((app) => app.status === stage);
          return (
            <KanbanColumn key={stage} stage={stage} apps={stageApps} />
          );
        })}
      </div>

    </div>
  );
}

function KanbanColumn({ stage, apps }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b-2 border-[var(--border-color)] pb-2">
        <h2 className="font-bold text-[var(--text-primary)] text-sm">{stage}</h2>
        <span className="bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs font-bold px-2 py-1 rounded-full border border-[var(--border-color)]">
          {apps.length}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {apps.length === 0 ? (
          <div className="p-4 text-sm text-[var(--text-secondary)] text-center italic border border-dashed border-[var(--border-color)] rounded-xl">
            No applications here.
          </div>
        ) : (
          apps.map((app) => <AppCard key={app.id} app={app} />)
        )}
      </div>
    </div>
  );
}

function AppCard({ app }) {
  return (
    <Link to={`/user/jobs/${app.jobId}`} className="block group">
      <div className="bg-[var(--bg-primary)] p-4 sm:p-5 rounded-xl border border-[var(--border-color)] shadow-sm group-hover:shadow-md group-hover:border-[var(--color-accent)] transition-all cursor-pointer flex flex-col gap-2">
        <h3 className="font-bold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-tight text-sm">
          {app.title}
        </h3>
        <p className="text-sm font-medium text-[var(--text-secondary)]">{app.company}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium bg-[var(--bg-secondary)] inline-block w-fit px-2 py-1 rounded border border-[var(--border-color)]">
          Applied: {app.date}
        </p>
      </div>
    </Link>
  );
}