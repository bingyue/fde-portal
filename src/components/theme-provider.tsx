"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("light");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSystemPrefersDark(media.matches);
      if (isThemePreference(saved)) setThemePreferenceState(saved);
      setHydrated(true);
    });

    const handleChange = (event: MediaQueryListEvent) =>
      setSystemPrefersDark(event.matches);
    media.addEventListener("change", handleChange);
    return () => {
      active = false;
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const resolvedTheme = resolveTheme(themePreference, systemPrefersDark);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    applyTheme(resolvedTheme);
  }, [hydrated, resolvedTheme, themePreference]);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference: setThemePreferenceState,
    }),
    [resolvedTheme, themePreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}

const options = [
  { value: "light", label: "浅色", Icon: Sun },
  { value: "dark", label: "深色", Icon: Moon },
  { value: "system", label: "跟随系统", Icon: Monitor },
] as const;

export function ThemeSelector({
  align = "right",
}: {
  align?: "left" | "right";
}) {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const [open, setOpen] = useState(false);
  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="选择界面主题"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="theme-selector"
        onClick={() => setOpen((value) => !value)}
        className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
      >
        <CurrentIcon size={17} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="界面主题"
          className={`absolute top-11 z-50 w-40 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-lg)] ${align === "right" ? "right-0" : "left-0"}`}
        >
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={themePreference === value}
              data-theme-option={value}
              onClick={() => {
                setThemePreference(value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
            >
              <Icon size={15} />
              <span className="flex-1">{label}</span>
              {themePreference === value && (
                <Check size={14} className="text-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
