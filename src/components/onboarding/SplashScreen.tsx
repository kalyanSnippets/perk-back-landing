import { useEffect, useState } from "react";
import perkbackLogo from "@/assets/perkback-logo-224.webp";

interface SplashScreenProps {
  onDone: () => void;
  /** Auto-dismiss after this many ms. */
  duration?: number;
}

/**
 * Brand splash shown on first visit (and inside Capacitor wrapper).
 * Gradient background, animated logo + tagline, then fades out.
 */
const SplashScreen = ({ onDone, duration = 1400 }: SplashScreenProps) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), duration);
    const t2 = setTimeout(onDone, duration + 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-hero transition-opacity duration-300 ease-apple ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={leaving}
    >
      <div className="animate-pop-in flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-3xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center shadow-hero">
          <img src={perkbackLogo} alt="PerkBack" className="w-16 h-16 object-contain" />
        </div>
        <div className="text-primary-foreground text-2xl font-bold tracking-tight">PerkBack</div>
        <div className="text-primary-foreground/70 text-xs font-medium uppercase tracking-[0.25em]">
          Loyalty made beautiful
        </div>
      </div>
      <div className="absolute bottom-10 flex gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.2s" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/80 animate-pulse-soft" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
};

export default SplashScreen;
