import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./components/shared/ThemeToggle";

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
