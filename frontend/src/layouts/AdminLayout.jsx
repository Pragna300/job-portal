import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, Briefcase, LogOut, Menu, X, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

const navLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/companies", label: "Companies", icon: Building2 },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/proctoring", label: "Live Proctoring", icon: Video },
];

const THEME_OPTIONS = [
  { value: "light",  icon: Sun,     label: "Light"  },
  { value: "dark",   icon: Moon,    label: "Dark"   },
  { value: "system", icon: Monitor, label: "System" },
];
 
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const current = THEME_OPTIONS.find((o) => o.value === theme);
  const Icon = current?.icon ?? Sun;
 
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Theme: ${current?.label}`}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-sm"
      >
        <Icon size={16} />
        <span>{current?.label} theme</span>
      </button>
 
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-10 z-50 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[140px]">
            {THEME_OPTIONS.map(({ value, icon: OptionIcon, label }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-[var(--bg-secondary)] ${
                  theme === value
                    ? "text-[var(--color-primary)] font-semibold"
                    : "text-[var(--text-primary)]"
                }`}
              >
                <OptionIcon size={14} />
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

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { theme, setTheme } = useTheme();
const cycleTheme = () => {
  const order = ["light", "dark", "system"];
  setTheme(order[(order.indexOf(theme) + 1) % order.length]);
};
const MobileThemeIcon = THEME_OPTIONS.find(o => o.value === theme)?.icon ?? Sun;


  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (link) =>
    link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary,#f3f4f6)]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-[100vh] w-64 bg-black text-white z-30 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:flex
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {navLinks.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${isActive({ to, exact })
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout at bottom of sidebar (desktop) */}
        <ThemeToggle />
        <div className="p-4 border-t border-white/10 hidden lg:block">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-red-400 hover:bg-white/10 transition-all w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="flex justify-between items-center px-4 sm:px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile/tablet only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors p-1"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">Admin Dashboard</h2>
          </div>


          <button onClick={cycleTheme} className="sm:hidden block"><MobileThemeIcon size={18} /></button>


          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}