"use client";

import { useEffect, useRef, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";

type AdminTheme = "dark" | "light";

const STORAGE_KEY = "baku-port-admin-theme";

/**
 * Toggles the admin's "Harbor Control" theme. It sets `data-admin-theme` on the
 * nearest `.admin-shell` ancestor so the same control works on every admin page
 * (console + login) without each page wiring up its own state.
 */
export function AdminThemeToggle() {
  const ref = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<AdminTheme>("dark");

  function applyTheme(next: AdminTheme) {
    const shell = ref.current?.closest<HTMLElement>(".admin-shell");

    if (shell) {
      shell.dataset.adminTheme = next;
    }
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const next: AdminTheme = stored === "light" ? "light" : "dark";

      setTheme(next);
      applyTheme(next);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  function toggleTheme() {
    const next: AdminTheme = theme === "dark" ? "light" : "dark";

    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const isDark = theme === "dark";

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggleTheme}
      className="hc-btn"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <SunMedium className="h-4 w-4" aria-hidden="true" />
      ) : (
        <MoonStar className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
