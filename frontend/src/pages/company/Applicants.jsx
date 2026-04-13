import { useState, useEffect } from "react";
import {
  Users, Search, Filter, Eye, UserCheck, UserX,
  FileText, ChevronDown, Loader,
} from "lucide-react";
import api from "../../services/api";

const Applicants = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes] = await Promise.all([
          api.get("/company/jobs"),
          api.get("/company/dashboard-stats"),
        ]);
        setJobs(jobsRes.data);

        const allApps = [];
        for (const job of jobsRes.data) {
          try {
            const appRes = await api.get(`/applications/job/${job.id}`);
            const enriched = appRes.data.map((app) => ({
              ...app,
              job_title: job.title,
              job_location: job.location,
              job_id: job.id,
              skills: app.skills
                ? typeof app.skills === "string"
                  ? JSON.parse(app.skills)
                  : app.skills
                : [],
            }));
            allApps.push(...enriched);
          } catch (e) {
            // skip failed job
          }
        }
        setApplications(allApps);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applicants");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateStatus = async (appId, newStatus) => {
    try {
      await api.put(`/applications/${appId}`, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const fetchInterviewResult = async (app) => {
  try {
    const res = await api.get(`/company/interview-results/${app.id}`);
    const latestResult = res.data?.results?.[0] || null;

    setResults((prev) => ({
      ...prev,
      [app.id]: latestResult,
    }));

    console.log("Interview result:", latestResult);
  } catch (err) {
    alert("No result found yet");
  }
};

  const getStatusBadge = (status) => {
    const styles = {
      applied: "bg-blue-100 text-blue-800",
      shortlisted: "bg-yellow-100 text-yellow-800",
      hired: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      interview: "bg-purple-100 text-purple-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const filteredApplications = applications.filter((app) => {
    const matchesJob =
      selectedJob === "all" || String(app.job_id) === String(selectedJob);
    const matchesStatus =
      selectedStatus === "all" || app.status === selectedStatus;
    const matchesSearch =
      searchTerm === "" ||
      (app.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.job_title || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesJob && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">{error}</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Applicants Management
        </h1>
      </div>

      {/* Filter bar — 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by name, email, or job"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Job filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] appearance-none"
            >
              <option value="all">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-[var(--text-secondary)] pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] appearance-none"
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-[var(--text-secondary)] pointer-events-none" />
          </div>
        </div>

        {/* Count — always in its own row below filters */}
        <div className="mt-3 text-right text-[var(--text-secondary)] text-sm">
          Showing {filteredApplications.length} of {applications.length} applicants
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <Users className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No applicants found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                        {app.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{app.email}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-secondary)]">Applied for:</span>
                      <span className="ml-2 text-[var(--text-primary)] font-medium">
                        {app.job_title}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Location:</span>
                      <span className="ml-2 text-[var(--text-primary)]">
                        {app.job_location || "Remote"}
                      </span>
                    </div>
                    {app.skills?.length > 0 && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-[var(--text-secondary)]">Skills:</span>
                        <div className="inline-flex flex-wrap gap-1 ml-2">
                          {app.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-1.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {app.skills.length > 4 && (
                            <span className="text-xs text-[var(--text-secondary)]">
                              +{app.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons — wrap freely on mobile, column on desktop */}
                <div className="flex flex-row flex-wrap md:flex-col gap-2 md:justify-start">
                  {app.resume_url && (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
                    >
                      <FileText className="h-4 w-4" /> Resume
                    </a>
                  )}
                  {app.status !== "shortlisted" &&
                    app.status !== "hired" &&
                    app.status !== "rejected" && (
                      <button
                        onClick={() => updateStatus(app.id, "shortlisted")}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition"
                      >
                        <UserCheck className="h-4 w-4" /> Shortlist
                      </button>
                    )}
                  {app.status === "shortlisted" && (
                    <button
                      onClick={() => updateStatus(app.id, "interview")}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition"
                    >
                      <Eye className="h-4 w-4" /> Interview
                    </button>
                  )}
                 {app.status === "interview" && (
  <>
    <button
      onClick={() => fetchInterviewResult(app)}
      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition"
    >
      Fetch Result
    </button>

    {/* Show Result */}
    {results[app.id] && (
  <div className="text-sm bg-[var(--bg-primary)] border rounded p-2 mt-1">
    <p><strong>Score:</strong> {results[app.id].score}/10</p>
  </div>
)}

    {/* Hire button */}
                <button
                  onClick={() => updateStatus(app.id, "hired")}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition"
                >
                  <UserCheck className="h-4 w-4" /> Hire
                </button>
              </>
            )}
                  {app.status !== "rejected" && app.status !== "hired" && (
                    <button
                      onClick={() => updateStatus(app.id, "rejected")}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
                    >
                      <UserX className="h-4 w-4" /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applicants;