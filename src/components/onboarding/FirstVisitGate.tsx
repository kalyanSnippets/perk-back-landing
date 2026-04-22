import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SplashScreen from "./SplashScreen";
import OnboardingCarousel from "./OnboardingCarousel";
import { isMobileAppContext } from "@/lib/deviceDetection";

const ONBOARDING_KEY = "perkback_onboarded_v1";
const SPLASH_KEY = "perkback_splash_seen_v1"; // session-only

type Stage = "splash" | "onboarding" | "done";

const isFirstSession = () => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SPLASH_KEY) !== "1";
  } catch {
    return false;
  }
};

const hasCompletedOnboarding = () => {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
};

/**
 * Shows the brand splash + 3-slide onboarding once per browser.
 * - Splash: every new tab session
 * - Onboarding: only until completed (persistent)
 * Skipped entirely on auth and reset-password routes to avoid blocking flows.
 */
const FirstVisitGate = () => {
  const location = useLocation();
  const skipPaths = ["/get-started", "/customer/auth", "/merchant/auth", "/reset-password"];
  const shouldSkip = skipPaths.some((p) => location.pathname.startsWith(p)) || isMobileAppContext();

  useEffect(() => {
    if (!shouldSkip) return;
    setStage("done");
  }, [shouldSkip]);

  const [stage, setStage] = useState<Stage>(() => {
    if (shouldSkip) return "done";
    if (isFirstSession()) return "splash";
    if (!hasCompletedOnboarding()) return "onboarding";
    return "done";
  });

  useEffect(() => {
    if (stage === "splash") {
      try {
        sessionStorage.setItem(SPLASH_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [stage]);

  if (stage === "done") return null;

  if (stage === "splash") {
    return (
      <SplashScreen
        onDone={() => setStage(hasCompletedOnboarding() ? "done" : "onboarding")}
      />
    );
  }

  return (
    <OnboardingCarousel
      onComplete={() => {
        try {
          localStorage.setItem(ONBOARDING_KEY, "1");
        } catch {
          /* ignore */
        }
        setStage("done");
      }}
    />
  );
};

export default FirstVisitGate;
