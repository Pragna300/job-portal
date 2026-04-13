import { useState, useEffect } from "react";
import {
  Users, Search, Filter, Eye, UserCheck, UserX,
  FileText, ChevronDown, Loader, X
} from "lucide-react";
import api from "../../services/api";

// Safe feedback parser — handles JSONB (already object) or string from DB
const parseFeedback = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
};

const Applicants = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedScore, setSelectedScore] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState({});
  const [selectedResult, setSelectedResult] = useState(null);

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
      test_completed: "bg-indigo-100 text-indigo-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const filteredApplications = applications.filter((app) => {
    const matchesJob =
      selectedJob === "all" || String(app.job_id) === String(selectedJob);
    const matchesStatus =
      selectedStatus === "all" || app.status === selectedStatus;
      
    let matchesScore = true;
    if (selectedScore !== "all") {
      const score = Number(app.test_score) || (results[app.id] ? Number(results[app.id].score) : 0);
      if (selectedScore === "high") matchesScore = score >= 80;
      else if (selectedScore === "medium") matchesScore = score >= 50 && score < 80;
      else if (selectedScore === "low") matchesScore = score > 0 && score < 50;
      else if (selectedScore === "pending") matchesScore = score === 0;
    }

    const matchesSearch =
      searchTerm === "" ||
      (app.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.job_title || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesJob && matchesStatus && matchesScore && matchesSearch;
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

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
              <option value="test_completed">Interview Completed</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-[var(--text-secondary)] pointer-events-none" />
          </div>

          {/* AI Score Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
            <select
              value={selectedScore}
              onChange={(e) => setSelectedScore(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] appearance-none"
            >
              <option value="all">All Scores</option>
              <option value="high">Top Performers (80%+)</option>
              <option value="medium">Average (50-79%)</option>
              <option value="low">Below Average (&#60;50%)</option>
              <option value="pending">Pending / No Test</option>
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
                 {(app.status === "interview" || app.status === "test_completed") && (
  <>
    <button
      onClick={() => fetchInterviewResult(app)}
      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition"
    >
      Fetch Result
    </button>

    {/* Show Result */}
    {results[app.id] && (
  <div className="text-sm bg-[var(--bg-primary)] border rounded p-4 mt-2 w-full max-w-full">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <strong style={{ fontSize: '1.1rem', color: '#2b6cb0' }}>AI Evaluation Score: {results[app.id].score}/100</strong>
      <button 
        onClick={() => setSelectedResult({ ...results[app.id], candidateName: app.name })}
        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-xs font-semibold"
      >
        View Detailed Report
      </button>
    </div>
    
    <div style={{ marginTop: '0.75rem' }}>
      <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#4a5568' }}>Analysis Summary Snippet:</strong>
      <p style={{ color: '#718096', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {(() => {
           const feedback = parseFeedback(results[app.id].feedback);
           return feedback.summary || "No textual summary provided by AI.";
        })()}
      </p>
    </div>
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

      {/* DETAILED RESULT MODAL */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-primary)] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Interview Performance Report</h2>
                <p className="text-[var(--text-secondary)] text-sm">{selectedResult.candidateName}</p>
              </div>
              <button 
                onClick={() => setSelectedResult(null)}
                className="text-gray-400 hover:text-gray-600 transition p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Score & Recommendation Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                  <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wider mb-2">Overall Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{selectedResult.score}</span>
                    <span className="text-indigo-200 text-xl">/ 100</span>
                  </div>
                </div>
                {(() => {
                    const fb = parseFeedback(selectedResult.feedback);
                    return (
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 flex flex-col justify-center shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Technical Depth</span>
                          <span className="text-lg font-bold text-indigo-600">{fb.technical_score || '--'}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">AI Proctoring Score</span>
                          <span className="text-lg font-bold text-emerald-600">{fb.integrity_score || (fb.proctoring?.integrity_score) || '--'}%</span>
                        </div>
                      </div>
                    );
                })()}
                {(() => {
                    const fb = parseFeedback(selectedResult.feedback);
                    const recColor = fb.recommendation === 'Hire' ? 'bg-green-100 text-green-800 border-green-200' : 
                                   fb.recommendation === 'Reject' ? 'bg-red-100 text-red-800 border-red-200' : 
                                   'bg-yellow-100 text-yellow-800 border-yellow-200';
                    return (
                      <div className={`p-6 rounded-xl border flex flex-col justify-center ${recColor}`}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Recommendation</p>
                        <p className="text-3xl font-bold">{fb.recommendation || 'Consider'}</p>
                      </div>
                    );
                })()}
              </div>

              {/* Detailed Feedback Sections */}
              {(() => {
                try {
                  const fb = parseFeedback(selectedResult.feedback);
                  return (
                    <>
                      <section className="space-y-3">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                          <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                          AI Evaluation Summary
                        </h3>
                        <div className="bg-[var(--bg-secondary)] p-5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] leading-relaxed">
                          {fb.summary}
                        </div>
                      </section>

                      {fb.integrity_context && (
                        <section className="space-y-3">
                          <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                            Integrity & Proctoring Context
                          </h3>
                          <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl text-orange-800">
                            {fb.integrity_context}
                            {fb.proctoring && (
                              <div className="mt-3 flex gap-4 text-xs font-semibold">
                                <span className={fb.proctoring.violation_count > 0 ? 'text-red-600' : ''}>Violations: {fb.proctoring.violation_count}</span>
                                <span>Integrity Score: {fb.proctoring.integrity_score}%</span>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {fb.question_wise && fb.question_wise.length > 0 && (
                        <section className="space-y-4">
                          <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            Question-wise Breakdown
                          </h3>
                          <div className="space-y-3">
                            {fb.question_wise.map((q, idx) => (
                              <div key={idx} className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-5 rounded-xl transition hover:shadow-md">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                  <h4 className="font-bold text-[var(--text-primary)]">{q.question}</h4>
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold whitespace-nowrap">
                                    Score: {q.score}/100
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] italic border-l-4 border-gray-200 pl-4">
                                  {q.feedback}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </>
                  );
                } catch {
                  return <p className="text-red-500">Error parsing detailed feedback.</p>;
                }
              })()}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border-color)] p-6 flex justify-end">
              <button 
                onClick={() => setSelectedResult(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;