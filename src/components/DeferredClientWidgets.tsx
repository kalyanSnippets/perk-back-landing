import { lazy, Suspense, useEffect, useState } from "react";

// Both widgets are non-critical for first paint:
//  - BackToTopButton: only visible after scrolling 300px
//  - PWAInstallPrompt: shown after a delay, never on first frame
// We lazy-import them and gate mounting behind requestIdleCallback so they
// never compete for main-thread time during initial load.

const BackToTopButton = lazy(() => import("@/components/BackToTopButton"));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt"));

const DeferredClientWidgets = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    const idle = (window as any).requestIdleCallback as
      | undefined
      | ((cb: () => void, opts?: { timeout: number }) => number);

    if (typeof idle === "function") {
      idleHandle = idle(() => setReady(true), { timeout: 3000 });
    } else {
      timeoutHandle = window.setTimeout(() => setReady(true), 2000);
    }

    return () => {
      if (idleHandle !== undefined && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <BackToTopButton />
      <PWAInstallPrompt />
    </Suspense>
  );
};

export default DeferredClientWidgets;
