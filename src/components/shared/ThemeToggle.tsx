import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "perkback_theme";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
};

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

/** Initialize theme as early as possible so first paint matches. */
export const initTheme = () => applyTheme(getInitialTheme());

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export const ThemeToggle = ({ className, size = "md" }: ThemeToggleProps) => {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const dims = size === "sm" ? "w-9 h-9" : "w-10 h-10";

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className={cn(
        dims,
        "rounded-md border border-border bg-card text-foreground flex items-center justify-center shadow-card hover:shadow-card-hover transition-all duration-200 ease-apple hover:-translate-y-0.5",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
};

export default ThemeToggle;
