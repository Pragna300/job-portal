import { useState, useEffect } from "react";
import {
  Users, Search, Filter, Eye, UserCheck, UserX,
  FileText, ChevronDown, Loader, Trash2, X,
  Award, TrendingUp, TrendingDown, MessageSquare,
  CheckCircle, AlertCircle, Clock,
} from "lucide-react";
import api from "../../services/api";

/* ── helpers ──────────────────────────────────────────────────────────────── */
const getStatusBadge = (status) => {
  const map = {
    applied:        "bg-blue-100 text-blue-800",
    shortlisted:    "bg-yellow-100 text-yellow-800",
    hired:          "bg-green-100 text-green-800",
    rejected:       "bg-red-100 text-red-800",
    interview:      "bg-purple-100 text-purple-800",
    test_completed: "bg-teal-100 text-teal-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};

const getStatusLabel = (status) => {
  if (status === "test_completed") return "Test Completed";
  return status?.charAt(0).toUpperCase() + status?.slice(1);
};

const getRecommendationStyle = (rec) => {
  const r = (rec || "").toLowerCase();
  if (r === "hire" || r === "strong hire")   return "bg-green-100 text-green-800 border-green-200";
  if (r === "reject" || r === "do not hire") return "bg-red-100 text-red-800 border-red-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
};

const ScoreGauge = ({ score }) => {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 70 ? "#10b981" : pct >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `conic-gradient(${color} ${pct * 3.6}deg, #e5e7eb 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "var(--bg-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1rem", color,
          }}
        >
          {pct}
        </div>
      </div>
      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>/ 100</span>
    </div>
  );
};

/* ── Report Modal ─────────────────────────────────────────────────────────── */
const ReportModal = ({ report, onClose, onAction }) => {
  if (!report) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--bg-secondary)", borderRadius: "1rem",
          width: "100%", maxWidth: 680, maxHeight: "90vh",
          overflow: "auto", padding: "2rem", position: "relative",
          border: "1px solid var(--border-color)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-secondary)", padding: "0.25rem",
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <ScoreGauge score={report.score} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              AI Interview Report
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0.25rem 0 0.5rem" }}>
              {report.candidate_name || "Candidate"} — {report.candidate_email || ""}
            </p>
            {report.recommendation && (
              <span
                style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem",
                          fontWeight: 600, border: "1px solid", display: "inline-block" }}
                className={getRecommendationStyle(report.recommendation)}
              >
                Recommendation: {report.recommendation}
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{
          display: "flex", gap: "1.5rem", flexWrap: "wrap",
          padding: "0.75rem 1rem", background: "var(--bg-primary)",
          borderRadius: "0.5rem", marginBottom: "1.25rem",
          fontSize: "0.8rem", color: "var(--text-secondary)",
        }}>
          <span><Clock size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Completed: {report.completed_at ? new Date(report.completed_at).toLocaleString() : "—"}
          </span>
          <span><MessageSquare size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Q&A: {report.questions_answered || 0} / {report.questions_asked || 0} answered
          </span>
          <span><AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Integrity: <span style={{ fontWeight: 600, color: report.integrity_score >= 80 ? "#10b981" : report.integrity_score >= 50 ? "#f59e0b" : "#ef4444" }}>{report.integrity_score !== undefined ? report.integrity_score + "%" : "—"}</span>
          </span>
        </div>

        {/* Summary */}
        {report.summary && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Summary
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {report.summary}
            </p>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          {(report.strengths?.length > 0) && (
            <div style={{ background: "var(--bg-primary)", borderRadius: "0.5rem", padding: "0.75rem" }}>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10b981", marginBottom: "0.5rem",
                           display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <TrendingUp size={14} /> Strengths
              </h4>
              <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {report.strengths.map((s, i) => <li key={i} style={{ marginBottom: "0.25rem" }}>{s}</li>)}
              </ul>
            </div>
          )}
          {(report.weaknesses?.length > 0) && (
            <div style={{ background: "var(--bg-primary)", borderRadius: "0.5rem", padding: "0.75rem" }}>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.5rem",
                           display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <TrendingDown size={14} /> Areas to Improve
              </h4>
              <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {report.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: "0.25rem" }}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Violations */}
        {report.violations?.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Proctoring Violations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {report.violations.map((v, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  background: "rgba(239, 68, 68, 0.1)", borderRadius: "0.5rem",
                  padding: "0.5rem 1rem", borderLeft: "3px solid #ef4444"
                }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ef4444" }}>
                    {v.violation_type.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {v.count} incident(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-question breakdown */}
        {report.per_question?.length > 0 && (
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              Question Breakdown
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {report.per_question.map((pq, i) => (
                <div key={i} style={{
                  background: "var(--bg-primary)", borderRadius: "0.5rem",
                  padding: "0.75rem 1rem", borderLeft: "3px solid var(--color-accent)",
                }}>
                  <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)", margin: "0 0 0.35rem" }}>
                    Q{i + 1}: {pq.question}
                  </p>
                  {pq.answer && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 0.35rem",
                                fontStyle: "italic" }}>
                      "{pq.answer}"
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    {pq.score !== undefined && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-accent)" }}>
                        Score: {pq.score}/10
                      </span>
                    )}
                    {pq.feedback && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {pq.feedback}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", gap: "0.75rem" }}>
          {onAction && (
            <>
              <button
                onClick={() => { onAction(report.application_id, "hired"); onClose(); }}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                  background: "var(--green)", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: "0.875rem", fontWeight: 500,
                }}
              >
                Hire
              </button>
              <button
                onClick={() => { onAction(report.application_id, "rejected"); onClose(); }}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                  background: "var(--red)", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: "0.875rem", fontWeight: 500,
                }}
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
              background: "var(--bg-primary)", border: "1px solid var(--border-color)",
              color: "var(--text-primary)", cursor: "pointer", fontSize: "0.875rem",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────────────────── */
const Applicants = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState({});
  const [activeReport, setActiveReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
      const res = await api.get(`/company/interview-results/${app.user_id}`);
      const report = { ...res.data, application_id: app.id };
      setResults((prev) => ({ ...prev, [app.id]: report }));
      setActiveReport(report);
    } catch (err) {
      alert("No AI report found yet. The candidate may not have completed the interview.");
    }
  };

  const openReport = (appId) => {
    if (results[appId]) setActiveReport(results[appId]);
  };

  const hardDelete = async (app) => {
    if (!window.confirm(`Permanently delete ${app.name || "this candidate"} and all their data? This cannot be undone.`)) return;
    setDeletingId(app.id);
    try {
      await api.delete(`/applications/${app.id}/hard-delete`);
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete candidate.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesJob    = selectedJob    === "all" || String(app.job_id) === String(selectedJob);
    const matchesStatus = selectedStatus === "all" || app.status === selectedStatus;
    const matchesSearch =
      searchTerm === "" ||
      (app.name  || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      {/* Report modal */}
      {activeReport && (
        <ReportModal 
          report={activeReport} 
          onClose={() => setActiveReport(null)} 
          onAction={updateStatus}
        />
      )}

      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Applicants Management
        </h1>
      </div>

      {/* Filter bar */}
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
                <option key={job.id} value={job.id}>{job.title}</option>
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
              <option value="test_completed">Test Completed</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-[var(--text-secondary)] pointer-events-none" />
          </div>
        </div>

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
                {/* Candidate info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                        {app.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{app.email}</p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-secondary)]">Applied for:</span>
                      <span className="ml-2 text-[var(--text-primary)] font-medium">{app.job_title}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Location:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{app.job_location || "Remote"}</span>
                    </div>
                    {app.ats_score !== undefined && app.ats_score !== null && (
                      <div>
                        <span className="text-[var(--text-secondary)]">ATS Score:</span>
                        <span className="ml-2 text-[var(--text-primary)] font-medium">{app.ats_score}/100</span>
                      </div>
                    )}
                    {app.test_score !== undefined && app.test_score !== null && (
                      <div>
                        <span className="text-[var(--text-secondary)]">Interview Score:</span>
                        <span className="ml-2 font-bold" style={{ color: app.test_score >= 70 ? "#10b981" : app.test_score >= 45 ? "#f59e0b" : "#ef4444" }}>
                          {app.test_score}/100
                        </span>
                      </div>
                    )}
                    {app.skills?.length > 0 && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-[var(--text-secondary)]">Skills:</span>
                        <div className="inline-flex flex-wrap gap-1 ml-2">
                          {app.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="px-1.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {app.skills.length > 4 && (
                            <span className="text-xs text-[var(--text-secondary)]">+{app.skills.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-row flex-wrap md:flex-col gap-2 md:justify-start">
                  {/* Resume */}
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

                  {/* Shortlist */}
                  {app.status !== "shortlisted" &&
                    app.status !== "hired" &&
                    app.status !== "rejected" &&
                    app.status !== "interview" &&
                    app.status !== "test_completed" && (
                      <button
                        onClick={() => updateStatus(app.id, "shortlisted")}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition"
                      >
                        <UserCheck className="h-4 w-4" /> Shortlist
                      </button>
                    )}

                  {/* Send to Interview */}
                  {app.status === "shortlisted" && (
                    <button
                      onClick={() => updateStatus(app.id, "interview")}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition"
                    >
                      <Eye className="h-4 w-4" /> Send Interview
                    </button>
                  )}

                  {/* Waiting for interview — disabled indicator */}
                  {app.status === "interview" && (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg border border-purple-200">
                      <Clock className="h-4 w-4" /> Awaiting Submission
                    </span>
                  )}

                  {/* Test Completed actions */}
                  {app.status === "test_completed" && (
                    <>
                      {/* View Report */}
                      <button
                        onClick={() => results[app.id] ? openReport(app.id) : fetchInterviewResult(app)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-100 text-teal-800 rounded-lg hover:bg-teal-200 transition"
                      >
                        <Award className="h-4 w-4" /> View Report
                      </button>
                      {/* Hire */}
                      <button
                        onClick={() => updateStatus(app.id, "hired")}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition"
                      >
                        <UserCheck className="h-4 w-4" /> Hire
                      </button>
                    </>
                  )}

                  {/* Reject */}
                  {app.status !== "rejected" && app.status !== "hired" && (
                    <button
                      onClick={() => updateStatus(app.id, "rejected")}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
                    >
                      <UserX className="h-4 w-4" /> Reject
                    </button>
                  )}

                  {/* Hard delete — only for rejected candidates */}
                  {app.status === "rejected" && (
                    <button
                      onClick={() => hardDelete(app)}
                      disabled={deletingId === app.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-700 transition border border-gray-200"
                    >
                      {deletingId === app.id
                        ? <Loader className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                      {deletingId === app.id ? "Deleting…" : "Delete"}
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