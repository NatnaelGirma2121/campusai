
"use client";

import { Sun, Moon } from "lucide-react";

import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ className = "" }: { className?: string }) {

  const { theme, toggleTheme } = useTheme();

  return (

    <button

      onClick={toggleTheme}

      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}

      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}

      className={`text-muted hover:text-text transition-colors ${className}`}

    >

      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}

    </button>

  );

}

