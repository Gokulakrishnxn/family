"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "family-theme";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", onStoreChange);
  };
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private browsing or blocked storage — fall back to the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * The stylesheet already follows `prefers-color-scheme`, so this only has to
 * pin an explicit override onto <html>.
 */
function applyToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

/**
 * `theme` is null on the server — it cannot know what this device prefers — so
 * components render a neutral placeholder until the client takes over.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);

  // Re-apply a stored override after hydration; CSS alone handles the default.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") applyToDocument(stored);
    } catch {
      // Nothing stored we can read; the system preference already applies.
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The choice still applies for this page view.
    }
    applyToDocument(next);
    listeners.forEach((notify) => notify());
  }, []);

  return {
    theme,
    setTheme,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
