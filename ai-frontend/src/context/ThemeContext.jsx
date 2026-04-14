import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

/**
 * FORCED LIGHT THEME PROVIDER
 * This provider is hardcoded to "light" mode based on user feedback 
 * to ensure a professional, standard white background corporate UI 
 * regardless of system settings.
 */
export function ThemeProvider({ children }) {
  // Always force light mode
  const [theme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    // Ensure localStorage is cleared of any dark preference for future sessions
    localStorage.setItem("theme", "light");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
