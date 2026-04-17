import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import perkbackLogo from "@/assets/perkback-logo-sm.webp";

// Preload the LCP image (header logo) with the Vite-hashed URL so the
// preload tag always matches the actual asset name across rebuilds.
const preloadLogo = document.createElement("link");
preloadLogo.rel = "preload";
preloadLogo.as = "image";
preloadLogo.href = perkbackLogo;
preloadLogo.fetchPriority = "high";
document.head.appendChild(preloadLogo);

// PWA: Unregister stale service workers in preview/iframe contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
