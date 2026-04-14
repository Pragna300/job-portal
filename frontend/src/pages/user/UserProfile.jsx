import { useState, useEffect } from "react";
import api from "../../services/api";

export default function UserProfile() {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    title: "",
    bio: "",
    customUrl: "",
    skills: [],
    projects: [],
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [skillInput, setSkillInput] = useState("");

  const AVAILABLE_SKILLS = [
    "JavaScript", "TypeScript", "Node.js", "Python",
    "React.js", "Vue.js", "Angular", "TailwindCSS",
    "Figma", "UI/UX", "GraphQL", "AWS", "Docker", "PostgreSQL",
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/profile");
      const userData = response.data;
      setProfile({
        name:      userData.name || "",
        email:     userData.email || "",
        title:     userData.title || "",
        bio:       userData.bio || "",
        customUrl: userData.custom_url || "",
        skills:    Array.isArray(userData.skills)
          ? userData.skills
          : userData.skills ? JSON.parse(userData.skills) : [],
        projects:  Array.isArray(userData.projects)
          ? userData.projects
          : userData.projects ? JSON.parse(userData.projects) : [],
      });
      setError("");
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSuccess("");
    setError("");
    const formData = new FormData();
    formData.append("name",       profile.name);
    formData.append("title",      profile.title);
    formData.append("bio",        profile.bio);
    formData.append("custom_url", profile.customUrl);
    formData.append("skills",     JSON.stringify(profile.skills));
    formData.append("projects",   JSON.stringify(profile.projects));
    if (resumeFile) formData.append("resume", resumeFile);

    try {
      await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Profile updated successfully");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  const handleAddSkill = (skill) => {
    if (!profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] });
    }
    setSkillInput("");
  };

  const handleAddProject = () => {
    setProfile({
      ...profile,
      projects: [...profile.projects, { id: Date.now(), name: "", url: "" }],
    });
  };

  const handleUpdateProject = (id, field, value) => {
    setProfile({
      ...profile,
      projects: profile.projects.map(p => p.id === id ? { ...p, [field]: value } : p),
    });
  };

  const suggestedSkills = AVAILABLE_SKILLS.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) && !profile.skills.includes(s)
  );

  if (loading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full max-w-4xl pb-12">

      {/* Header — stacks on mobile */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] tracking-tight">
            My Profile
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
            Manage your personal information and resume.
          </p>
        </div>
        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className={`w-full sm:w-auto px-6 py-2 rounded-xl font-bold shadow-sm transition-colors ${
            isEditing
              ? "bg-[var(--color-accent)] text-white hover:bg-opacity-90"
              : "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--color-primary)]"
          }`}
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </button>
      </header>

      {error   && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded-xl text-sm">{success}</div>}

      {/* Basic Information */}
      <section className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col gap-6">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)]">
          Basic Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-secondary)]">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={!isEditing}
              className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-60 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-secondary)]">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] opacity-70 cursor-not-allowed"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 md:col-span-1">
            <label className="text-sm font-semibold text-[var(--text-secondary)]">
              Professional Title
            </label>
            <input
              type="text"
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              disabled={!isEditing}
              className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-60 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-secondary)]">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            disabled={!isEditing}
            rows="4"
            className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-60 transition-colors resize-none"
            placeholder="Tell us a little bit about yourself..."
          />
        </div>

        {/* Custom URL — prefix + input, wraps gracefully on mobile */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-secondary)]">
            Custom Profile URL
          </label>
          <div className="flex items-stretch min-w-0">
            <span className="px-3 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] border-r-0 rounded-l-xl text-[var(--text-secondary)] font-medium text-sm whitespace-nowrap flex-shrink-0">
              shnoor.com/
            </span>
            <input
              type="text"
              value={profile.customUrl}
              onChange={(e) => setProfile({ ...profile, customUrl: e.target.value })}
              disabled={!isEditing}
              className="flex-1 min-w-0 p-3 rounded-r-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-60 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Resume */}
      <section className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)]">Resume</h2>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files[0])}
          disabled={!isEditing}
          className="block w-full text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-secondary)] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        />
        {isEditing && (
          <p className="text-xs text-[var(--text-secondary)]">
            Upload new resume (PDF, DOC, DOCX)
          </p>
        )}
      </section>

      {/* Skills */}
      <section className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)]">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map(skill => (
            <span
              key={skill}
              className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold rounded-full border border-[var(--border-color)] flex items-center gap-2"
            >
              {skill}
              {isEditing && (
                <button
                  onClick={() =>
                    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) })
                  }
                  className="text-[var(--text-secondary)] hover:text-red-500 font-bold leading-none"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="relative">
            <input
              type="text"
              placeholder="Type to search skills..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            {skillInput && suggestedSkills.length > 0 && (
              <ul className="absolute top-full mt-2 w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {suggestedSkills.map(skill => (
                  <li
                    key={skill}
                    onClick={() => handleAddSkill(skill)}
                    className="p-3 hover:bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-primary)] font-medium border-b border-[var(--border-color)] last:border-0 text-sm"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Portfolio & Projects */}
      <section className="bg-[var(--bg-primary)] p-5 sm:p-6 rounded-xl border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)]">
          Portfolio & Projects
        </h2>
        {profile.projects.map((project) => (
          <div key={project.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Project Name"
              value={project.name}
              onChange={(e) => handleUpdateProject(project.id, "name", e.target.value)}
              disabled={!isEditing}
              className="flex-1 min-w-0 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-60 transition-colors"
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={project.url}
              onChange={(e) => handleUpdateProject(project.id, "url", e.target.value)}
              disabled={!isEditing}
              className="flex-[2] min-w-0 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-60 transition-colors"
            />
            {isEditing && (
              <button
                onClick={() =>
                  setProfile({
                    ...profile,
                    projects: profile.projects.filter(p => p.id !== project.id),
                  })
                }
                className="text-red-500 hover:text-red-700 font-bold px-2 self-center sm:self-auto"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {isEditing && (
          <button
            onClick={handleAddProject}
            className="self-start text-[var(--color-accent)] font-bold hover:underline text-sm mt-2"
          >
            + Add another project
          </button>
        )}
      </section>
    </div>
  );
}