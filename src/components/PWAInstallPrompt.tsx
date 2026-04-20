import { forwardRef, useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

const PWAInstallPrompt = forwardRef<HTMLDivElement>((_props, _ref) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Don't show if already dismissed or already installed
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone) return; // iOS standalone

    // Show on all screen sizes

    setDismissed(false);

    // Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari detection
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setShowIOSPrompt(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-md rounded-xl bg-[hsl(var(--primary))] p-4 shadow-lg text-primary-foreground">
        <div className="flex items-start gap-3">
          <img
            src="/apple-touch-icon.png"
            alt="PerkBack"
            className="h-12 w-12 rounded-xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install PerkBack</h3>
            {deferredPrompt ? (
              <p className="text-xs opacity-90 mt-0.5">
                Add to your home screen for quick access to your rewards.
              </p>
            ) : (
              <p className="text-xs opacity-90 mt-0.5">
                Tap <Share className="inline h-3 w-3 mx-0.5" /> Share, then "Add to Home Screen" to install.
              </p>
            )}
          </div>
          <button onClick={dismiss} className="opacity-70 hover:opacity-100 flex-shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
        {deferredPrompt && (
          <Button
            onClick={handleInstall}
            size="sm"
            variant="secondary"
            className="w-full mt-3 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Install App
          </Button>
        )}
      </div>
    </div>
  );
});

PWAInstallPrompt.displayName = "PWAInstallPrompt";

export default PWAInstallPrompt;
