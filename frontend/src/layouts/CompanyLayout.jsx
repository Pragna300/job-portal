import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Briefcase, Users, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext"; // adjust path
import { Sun, Moon, Monitor } from "lucide-react";

const THEME_OPTIONS = [
  { value: "light",  icon: Sun,     label: "Light"  },
  { value: "dark",   icon: Moon,    label: "Dark"   },
  { value: "system", icon: Monitor, label: "System" },
];

export default function CompanyLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/company/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/company/post-job", icon: <PlusCircle size={18} />, label: "Post Job" },
    { to: "/company/jobs", icon: <Briefcase size={18} />, label: "My Jobs" },
    { to: "/company/applicants", icon: <Users size={18} />, label: "Applicants" },
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

const { theme, setTheme } = useTheme();
const cycleTheme = () => {
  const order = ["light", "dark", "system"];
  setTheme(order[(order.indexOf(theme) + 1) % order.length]);
};
const MobileThemeIcon = THEME_OPTIONS.find(o => o.value === theme)?.icon ?? Sun;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-gray-900 text-white flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold">Company Panel</h1>
        <div className="flex gap-4 items-center">
        <button onClick={cycleTheme}><MobileThemeIcon size={18} /></button>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky lg:top-0 lg:h-screen z-30 top-0 left-0 h-full w-64 bg-gray-900 text-white p-5 flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

        <button
          className="lg:hidden mb-4 self-end"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <h1 className="text-xl font-bold mb-6">Company Panel</h1>

        <nav className="flex flex-col gap-4">
          {navLinks.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm transition ${
                  isActive ? "text-green-400 font-semibold" : "hover:text-green-400"
                }`
              }
            >
              {icon} {label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2 text-red-400 text-sm pt-6 border-t border-gray-700"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop topbar */}
        <header className="hidden lg:flex justify-between items-center p-4 bg-white shadow">
          <h2 className="font-semibold">Company Dashboard</h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500"
          >
            <LogOut size={18} /> Logout
          </button>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 mt-14 lg:mt-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}