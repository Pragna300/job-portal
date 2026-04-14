import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import api from "../../services/api";

export default function Users() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users");
        setUserList(res.data.map((u) => ({
          ...u,
          skills: u.skills ? (typeof u.skills === "string" ? JSON.parse(u.skills) : u.skills) : [],
        })));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await api.put(`/admin/users/${id}/status`, { status: newStatus });
      setUserList((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status");
    }
  };

  const filteredUsers = userList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id) => setExpandedUserId(expandedUserId === id ? null : id);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl pb-12">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">Candidate Management</h1>
        </header>
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-6 sm:p-8 text-center text-[var(--text-secondary)] animate-pulse">
          Loading candidates...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 sm:p-8 text-center text-red-500 bg-red-50 rounded-xl">{error}</div>;
  }

  /* ── Shared expandable profile panel ── */
  const ProfilePanel = ({ user }) => (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-3">
      <div className="flex-1">
        <h4 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider mb-2">
          Profile Details
        </h4>
        <p className="text-sm text-[var(--text-primary)] mb-2">
          <span className="font-semibold text-[var(--text-secondary)]">Bio: </span>
          {user.bio || "No bio provided."}
        </p>
        <p className="text-sm text-[var(--text-primary)]">
          <span className="font-semibold text-[var(--text-secondary)]">Skills: </span>
          {user.skills?.length > 0 ? user.skills.join(", ") : "No skills listed."}
        </p>
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider mb-2">
          Recent Applications
        </h4>
        <ul className="space-y-2">
          {user.recent_applications?.length > 0 ? (
            user.recent_applications.map((app) => (
              <li
                key={app.id}
                className="text-sm flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-color)] shadow-sm"
              >
                <Link
                  to={`/admin/jobs/${app.job_id}`}
                  className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] hover:underline transition-colors truncate mr-2"
                >
                  {app.job_title}
                </Link>
                <span className="text-xs font-bold px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--color-accent)] uppercase tracking-wider shrink-0">
                  {app.status}
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-[var(--text-secondary)] italic">No applications found.</li>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full max-w-7xl pb-12">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">Candidate Management</h1>
          <p className="text-[var(--text-secondary)] mt-1 sm:mt-2 text-sm sm:text-base">View profiles and manage candidate accounts.</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-72 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] shadow-sm transition-colors text-sm"
        />
      </header>

      {/* Mobile & Tablet: Card list */}
      <section className="flex flex-col gap-3 md:hidden">
        {filteredUsers.length === 0 ? (
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-6 text-center text-[var(--text-secondary)] italic text-sm">
            No candidates found.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--color-primary)] truncate">{user.name}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{user.email}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${
                    user.status === "active"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                    {user.status === "active" ? "Active" : "Suspended"}
                  </span>
                </div>

                <div className="flex gap-2 text-xs text-[var(--text-secondary)] mt-2">
                  <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    {user.title || "Candidate"}
                  </span>
                  <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    {user.apps_count} applications
                  </span>
                </div>

                <div className="flex gap-3 pt-3 mt-3 border-t border-[var(--border-color)]">
                  <button
                    onClick={() => toggleExpand(user.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm font-semibold py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {expandedUserId === user.id ? (
                      <><ChevronUp size={14} /> Close</>
                    ) : (
                      <><ChevronDown size={14} /> Profile</>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    className={`flex-1 text-sm font-semibold text-center py-2 rounded-lg border transition-colors ${
                      user.status === "active"
                        ? "border-red-300 text-red-500 hover:bg-red-500 hover:text-white"
                        : "border-green-300 text-green-500 hover:bg-green-500 hover:text-white"
                    }`}
                  >
                    {user.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </div>
              </div>

              {expandedUserId === user.id && (
                <div className="px-4 pb-4 pt-1 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
                  <ProfilePanel user={user} />
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Desktop: Table */}
      <section className="hidden md:block bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm uppercase tracking-wider">
              <th className="p-3 sm:p-4 font-semibold">Candidate</th>
              <th className="p-3 sm:p-4 font-semibold">Title</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Applications</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Status</th>
              <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 sm:p-8 text-center text-[var(--text-secondary)] italic">
                  No candidates found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <Fragment key={user.id}>
                  <tr className="hover:bg-[var(--bg-secondary)] transition-colors group">
                    <td className="p-3 sm:p-4">
                      <div className="font-bold text-[var(--color-primary)]">{user.name}</div>
                      <div className="text-sm text-[var(--text-secondary)] mt-1">{user.email}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-[var(--text-secondary)] font-medium">{user.title || "Candidate"}</td>
                    <td className="p-3 sm:p-4 text-center font-bold text-[var(--text-primary)]">{user.apps_count}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        user.status === "active"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        {user.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex justify-end gap-4 items-center">
                        <button
                          onClick={() => toggleExpand(user.id)}
                          className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                        >
                          {expandedUserId === user.id ? "Close" : "View Profile"}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`text-sm font-semibold transition-colors ${
                            user.status === "active"
                              ? "text-[var(--text-secondary)] hover:text-red-500"
                              : "text-red-500 hover:text-green-500"
                          }`}
                        >
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedUserId === user.id && (
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                      <td colSpan="5" className="p-4 sm:p-6">
                        <ProfilePanel user={user} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}