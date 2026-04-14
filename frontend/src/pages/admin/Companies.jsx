import { useState, useEffect } from "react";
import api from "../../services/api";

export default function Companies() {
  const [companyList, setCompanyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/admin/companies");
        setCompanyList(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load companies");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleToggleApprove = async (id, currentApproved) => {
    try {
      if (!currentApproved) {
        await api.put(`/admin/companies/${id}/approve`);
        setCompanyList((prev) =>
          prev.map((c) => (c.id === id ? { ...c, approved: true } : c))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve company");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await api.put(`/admin/companies/${id}/status`, { status: newStatus });
      setCompanyList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update company status");
    }
  };

  const filteredCompanies = companyList.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl pb-12">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">Company Management</h1>
        </header>
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-6 sm:p-8 text-center animate-pulse text-[var(--text-secondary)]">
          Loading companies...
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">Company Management</h1>
          <p className="text-[var(--text-secondary)] mt-1 sm:mt-2 text-sm sm:text-base">View, verify, and manage employers on the platform.</p>
        </div>
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-72 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] shadow-sm transition-colors text-sm"
        />
      </header>

      {/* Mobile & Tablet: Card list */}
      <section className="flex flex-col gap-3 md:hidden">
        {filteredCompanies.length === 0 ? (
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-6 text-center text-[var(--text-secondary)] italic text-sm">
            No companies found.
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <div key={company.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm p-4">
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-bold text-[var(--color-primary)] truncate">{company.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{company.email}</div>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    company.approved
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                  }`}>
                    {company.approved ? "Approved" : "Pending"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    company.status === "active"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                    {company.status === "active" ? "Active" : "Suspended"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-[var(--text-secondary)] mb-3">
                <span>{company.location || "Remote"}</span>
                <span className="font-semibold text-[var(--text-primary)]">{company.job_count ?? 0} jobs</span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[var(--border-color)]">
                {!company.approved && (
                  <button
                    onClick={() => handleToggleApprove(company.id, company.approved)}
                    className="flex-1 text-sm font-semibold text-center py-2 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleToggleStatus(company.id, company.status)}
                  className={`flex-1 text-sm font-semibold text-center py-2 rounded-lg border transition-colors ${
                    company.status === "active"
                      ? "border-red-300 text-red-500 hover:bg-red-500 hover:text-white"
                      : "border-green-300 text-green-500 hover:bg-green-500 hover:text-white"
                  }`}
                >
                  {company.status === "active" ? "Suspend" : "Activate"}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Desktop: Table */}
      <section className="hidden md:block bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm uppercase tracking-wider">
              <th className="p-3 sm:p-4 font-semibold">Company</th>
              <th className="p-3 sm:p-4 font-semibold">Location</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Active Jobs</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Approval</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Status</th>
              <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 sm:p-8 text-center text-[var(--text-secondary)] italic">
                  No companies found.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="p-3 sm:p-4">
                    <div className="font-bold text-[var(--color-primary)]">{company.name}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">{company.email}</div>
                  </td>
                  <td className="p-3 sm:p-4 text-[var(--text-secondary)] font-medium">{company.location || "Remote"}</td>
                  <td className="p-3 sm:p-4 text-center font-bold text-[var(--text-primary)]">{company.job_count ?? 0}</td>
                  <td className="p-3 sm:p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      company.approved
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    }`}>
                      {company.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      company.status === "active"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {company.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex justify-end gap-4 items-center">
                      {!company.approved && (
                        <button
                          onClick={() => handleToggleApprove(company.id, company.approved)}
                          className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(company.id, company.status)}
                        className={`text-sm font-semibold transition-colors ${
                          company.status === "active"
                            ? "text-[var(--text-secondary)] hover:text-red-500"
                            : "text-red-500 hover:text-green-500"
                        }`}
                      >
                        {company.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}