import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./components/shared/ThemeToggle";

const MODULE_LOAD_ERROR_RE = /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i;
const CHUNK_RELOAD_KEY = "perkback:chunk-reload-attempted";

const getErrorMessage = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (typeof value === "object" && value && "message" in value) {
    return String((value as { message?: unknown }).message ?? "");
  }
  return "";
};

const reloadForModuleLoadFailure = () => {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    return;
  }

  window.location.reload();
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadForModuleLoadFailure();
});

window.addEventListener("error", (event) => {
  if (MODULE_LOAD_ERROR_RE.test(getErrorMessage(event.error ?? event.message))) {
    reloadForModuleLoadFailure();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (MODULE_LOAD_ERROR_RE.test(getErrorMessage(event.reason))) {
    event.preventDefault();
    reloadForModuleLoadFailure();
  }
});

// Apply persisted theme as early as possible to avoid first-paint flash.
initTheme();

// The header logo is rendered eagerly with fetchPriority="high" inside <Header>,
// so an additional JS-injected preload would just duplicate the request.

// PWA: Unregister stale service workers in preview/iframe contexts.
// Deferred to idle to avoid blocking first paint.
const cleanupStaleWorkers = () => {
  let isInIframe = true;
  try { isInIframe = window.self !== window.top; } catch { /* sandboxed */ }

  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app");

  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker?.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    });
  }
};

const idle = (window as any).requestIdleCallback as
  | undefined
  | ((cb: () => void, opts?: { timeout: number }) => number);
if (typeof idle === "function") {
  idle(cleanupStaleWorkers, { timeout: 3000 });
} else {
  setTimeout(cleanupStaleWorkers, 1500);
}

createRoot(document.getElementById("root")!).render(<App />);

try {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
} catch {
  // Ignore storage access issues in restricted environments.
}
