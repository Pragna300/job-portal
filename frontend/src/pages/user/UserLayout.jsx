import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

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

export default function UserLayout() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Cycle through themes for the mobile topbar icon button
  const cycleTheme = () => {
    const order = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };
  const MobileThemeIcon = THEME_OPTIONS.find((o) => o.value === theme)?.icon ?? Sun;

  const navLinks = [
    { to: "/user",              label: "Dashboard",       end: true },
    { to: "/user/profile",      label: "My Profile"               },
    { to: "/user/jobs",         label: "Find Jobs"                },
    { to: "/user/applications", label: "My Applications"          },
    { to: "/user/saved",        label: "Saved Jobs"               },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">

      {/* ── Mobile Topbar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold text-[var(--color-primary)]">Shnoor</h2>
        <div className="flex items-center gap-1">
          {/* Single-click cycle icon for mobile */}
          <button
            onClick={cycleTheme}
            title={`Theme: ${THEME_OPTIONS.find(o => o.value === theme)?.label}`}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <MobileThemeIcon size={18} />
          </button>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="p-2 text-[var(--text-primary)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto
        z-30 top-0 left-0 h-full w-64
        bg-[var(--bg-primary)] border-r border-[var(--border-color)]
        p-6 flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}>
        {/* Close btn — mobile only */}
        <button
          className="lg:hidden mb-6 self-end p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        <h2 className="text-2xl font-extrabold text-[var(--color-primary)] mb-10">
          Shnoor
        </h2>

        <nav className="flex flex-col gap-1 text-sm">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "font-bold text-[var(--color-primary)] bg-[var(--bg-secondary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-secondary)]"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle — full dropdown in sidebar */}
        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <ThemeToggle />
        </div>

        <button
          onClick={logout}
          className="mt-4 pt-4 border-t border-[var(--border-color)] text-red-500 text-sm text-left hover:text-red-600 transition-colors px-3 py-2"
        >
          Logout
        </button>
      </aside>

      {/* Backdrop — mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 mt-14 lg:mt-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}