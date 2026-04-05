import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";
import loyaltyCardImg from "@/assets/loyalty-card-v2.webp";

const HeroSection = () => {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <section id="home" className="relative pt-20 pb-12 sm:pt-28 sm:pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl -z-10" />

        {/* Sparkle particles */}
        <div className="hero-particles" />

        <div className="container mx-auto px-4 lg:px-8">
          {/* Centered text content */}
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground animate-fade-up">
              Earn rewards everywhere.{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                One card. One wallet.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed animate-fade-up-delay-1 max-w-2xl mx-auto">
              Perk Back helps customers earn points, stamps, and perks across partner stores — and
              helps merchants turn first-time buyers into regulars.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center animate-fade-up-delay-2">
              <Button variant="hero" size="xl" asChild>
                <Link to="/get-started">Explore Now</Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
          </div>

          {/* Two-column showcase: Video + Loyalty Card */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-10 mt-12 lg:mt-16 items-center animate-fade-up-delay-3">
            {/* Video thumbnail with glassmorphism */}
            <div
              onClick={() => setVideoOpen(true)}
              className="relative rounded-2xl overflow-hidden glass-card aspect-video group cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src="/images/video-thumbnail.jpg"
                alt="PerkBack introduction video preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-button group-hover:scale-110 transition-transform duration-300">
                  <Play className="text-primary-foreground ml-1" size={32} />
                </div>
              </div>
              <p className="absolute bottom-4 left-4 text-sm font-medium text-white/90">
                Watch how Perk Back works
              </p>
            </div>

            {/* Loyalty card mockup */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={loyaltyCardImg}
                  alt="Perk Back digital loyalty card with barcode and reward points"
                  className="w-full max-w-md animate-float drop-shadow-2xl"
                />
                {/* Floating badges */}
                <div className="absolute -top-4 -left-4 bg-card rounded-xl px-4 py-2 shadow-card animate-float" style={{ animationDelay: "0.5s" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-sm font-semibold text-foreground">+50 Points</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-card rounded-xl px-4 py-2 shadow-card animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">☕</span>
                    <span className="text-sm font-semibold text-foreground">5/10 Stamps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video lightbox modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setVideoOpen(false)}
        >
          <button
            onClick={() => setVideoOpen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10"
            aria-label="Close video"
          >
            <X size={32} />
          </button>
          <div
            className="w-full max-w-4xl mx-4 aspect-video rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src="/videos/perkback-intro.mp4"
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default HeroSection;
