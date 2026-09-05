
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {

  theme: Theme;

  toggleTheme: () => void;

}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = "campusai_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {

  // Default matches the inline anti-flash script in layout.tsx, which sets

  // data-theme on <html> before React hydrates — this just keeps React's

  // state in sync with whatever that script already applied.

  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {

    const current = document.documentElement.getAttribute("data-theme");

    if (current === "light" || current === "dark") {

      setTheme(current);

    }

  }, []);

  useEffect(() => {

    document.documentElement.setAttribute("data-theme", theme);

  }, [theme]);

  const toggleTheme = useCallback(() => {

    setTheme((prev) => {

      const next: Theme = prev === "dark" ? "light" : "dark";

      window.localStorage.setItem(THEME_KEY, next);

      return next;

    });

  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;

}

export function useTheme() {

  const ctx = useContext(ThemeContext);

  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");

  return ctx;

}

