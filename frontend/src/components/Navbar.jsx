import { Link } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Briefcase,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  User,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/shnoor-logo.png";

const THEME_OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

function ThemeToggle({ scrolled }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = THEME_OPTIONS.find((o) => o.value === theme);
  const Icon = current?.icon ?? Sun;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Theme: ${current?.label}`}
        className={`p-2 rounded-lg transition flex items-center gap-1 ${
          scrolled
            ? "text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-white/10"
            : "text-white hover:bg-white/10"
        }`}
      >
        <Icon size={18} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-50 bg-white dark:bg-[#1e293b] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[130px]">
            {THEME_OPTIONS.map(({ value, icon: OptionIcon, label }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-gray-100 dark:hover:bg-white/10 ${
                  theme === value
                    ? "text-[var(--color-primary)] font-semibold"
                    : "text-[var(--text-primary)]"
                }`}
              >
                <OptionIcon size={15} />
                {label}
                {theme === value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const navConfig = {
    guest: [
      { label: "Home", to: "/", icon: Home },
      { label: "Jobs", to: "/jobs", icon: Briefcase },
      { label: "Login", to: "/login", icon: LogIn },
      { label: "Register", to: "/register", icon: UserPlus, highlight: true },
    ],
    user: [
      { label: "Dashboard", to: "/user", icon: LayoutDashboard },
      { label: "Profile", to: "/user/profile", icon: User },
    ],
    company: [
      { label: "Dashboard", to: "/company", icon: LayoutDashboard },
      { label: "Post Job", to: "/company/post-job", icon: Briefcase },
      { label: "My Jobs", to: "/company/jobs" },
      { label: "Applicants", to: "/company/applicants" },
    ],
    admin: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Companies", to: "/admin/companies", icon: Building2 },
      { label: "Jobs", to: "/admin/jobs", icon: Briefcase },
    ],
  };

  const currentRole = user ? user.role : "guest";
  const links = navConfig[currentRole];

  return (
    <>
      <nav
        className={`fixed w-full z-50 backdrop-blur-md bg-white/10 border-b border-white/20 ${
          scrolled
            ? "bg-[var(--bg-primary)] shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-16 h-16 rounded-lg">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span
              className={`${
                scrolled ? "text-[var(--text-primary)]" : "text-white"
              } font-semibold text-3xl`}
            >
              Job Hunt
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex gap-6 items-center">
            {links.map((item, index) => {
              const Icon = item.icon;
              if (item.highlight) {
                return (
                  <Link
                    key={index}
                    to={item.to}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black rounded-lg hover:opacity-90 transition"
                  >
                    {Icon && <Icon size={18} />}
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={index}
                  to={item.to}
                  className={`flex items-center gap-2 ${
                    scrolled ? "text-[var(--text-primary)]" : "text-white"
                  } hover:opacity-80 transition`}
                >
                  {Icon && <Icon size={18} />}
                  {item.label}
                </Link>
              );
            })}

            {user && (
              <button onClick={logout} className="flex items-center gap-2 text-red-500">
                <LogOut size={18} />
                Logout
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle scrolled={scrolled} />
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle scrolled={scrolled} />
            <button
              onClick={() => setOpen(!open)}
              className={`p-2 rounded-lg transition ${
                scrolled
                  ? "text-[var(--text-primary)] hover:bg-gray-100"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-[var(--bg-primary)] shadow-2xl animate-slide-in">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[var(--border-color)] flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src={logo} className="w-full h-full object-cover" alt="Logo" />
                </div>
                <span className="font-bold text-xl text-[var(--text-primary)]">Job Hunt</span>
              </div>

              <div className="flex-1 py-6 px-4 space-y-2">
                {links.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={index}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[var(--text-primary)]"
                    >
                      {Icon && <Icon size={20} />}
                      {item.label}
                    </Link>
                  );
                })}

                {user && (
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 w-full"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
                Find your dream job today
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}