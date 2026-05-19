import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Coffee, ShoppingBag, UtensilsCrossed, Sparkles } from "lucide-react";
import loyaltyCardImg from "@/assets/loyalty-card-v2.webp";

const HeroSection = () => {
  // Decorative shapes/particles are non-critical for LCP and add paint cost.
  // Mount them only after the browser is idle (post first paint).
  const [decorReady, setDecorReady] = useState(false);

  useEffect(() => {
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    const idle = (window as any).requestIdleCallback as
      | undefined
      | ((cb: () => void, opts?: { timeout: number }) => number);
    if (typeof idle === "function") {
      idleHandle = idle(() => setDecorReady(true), { timeout: 1500 });
    } else {
      timeoutHandle = window.setTimeout(() => setDecorReady(true), 600);
    }
    return () => {
      if (idleHandle !== undefined && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  return (
    <section id="home" className="relative pt-20 pb-12 sm:pt-28 sm:pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background gradient — deeper & more saturated */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-light-blue to-background -z-10" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/12 blur-3xl -z-10" />

      {/* GoRewards-style floating decorative shapes — deferred to idle */}
      {decorReady && (
        <>
          <div className="floating-circle w-16 h-16 bg-coral/20 top-[15%] left-[5%]" style={{ animationDelay: "0s" }} />
          <div className="floating-circle w-10 h-10 bg-teal/25 top-[25%] right-[8%]" style={{ animationDelay: "1s" }} />
          <div className="floating-dot w-5 h-5 bg-accent/30 top-[60%] left-[10%]" style={{ animationDelay: "0.5s" }} />
          <div className="floating-dot w-4 h-4 bg-secondary/25 bottom-[20%] right-[15%]" style={{ animationDelay: "2s" }} />
          <div className="floating-circle w-8 h-8 border-2 border-coral/20 top-[40%] right-[4%]" style={{ animationDelay: "1.5s" }} />
          <div className="floating-dot w-3 h-3 bg-emerald-accent/30 top-[10%] right-[30%]" style={{ animationDelay: "3s" }} />
          <div className="hero-particles" />
        </>
      )}

      <div className="container mx-auto px-4 lg:px-8">
        {/* Centered text content */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5 animate-fade-up">
            <Sparkles size={14} />
            <span>Australia's smartest loyalty platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground animate-fade-up">
            Your store. Your card.{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your customers.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed animate-fade-up-delay-1 max-w-2xl mx-auto">
            PerkBack gives every business a fully branded digital loyalty card — and gives
            customers one app to carry them all.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center animate-fade-up-delay-2">
            <Button variant="hero" size="xl" asChild>
              <Link to="/get-started">Explore Now</Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          {/* Lightweight trust row — pure CSS, zero image cost */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground animate-fade-up-delay-2">
            <span className="font-medium">Trusted by</span>
            <div className="flex items-center gap-1.5">
              <Coffee size={16} className="text-amber-600" />
              <span>Cafes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShoppingBag size={16} className="text-blue-600" />
              <span>Retailers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed size={16} className="text-emerald-600" />
              <span>Restaurants</span>
            </div>
            <span className="hidden sm:inline">across Australia</span>
          </div>
        </div>

        {/* Centered loyalty card showcase */}
        <div className="mt-12 lg:mt-16 flex justify-center animate-fade-up-delay-3">
          <div className="relative">
            <img
              src={loyaltyCardImg}
              alt="Perk Back digital loyalty card with barcode and reward points"
              width={512}
              height={512}
              fetchPriority="high"
              decoding="async"
              className="w-full max-w-md md:max-w-lg animate-float drop-shadow-2xl"
            />
            {/* Floating badges */}
            <div className="absolute -top-4 -left-4 bg-card rounded-2xl px-4 py-2 shadow-card animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-accent" />
                <span className="text-sm font-semibold text-foreground">+50 Points</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-card rounded-2xl px-4 py-2 shadow-card animate-float" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">☕</span>
                <span className="text-sm font-semibold text-foreground">5/10 Stamps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
