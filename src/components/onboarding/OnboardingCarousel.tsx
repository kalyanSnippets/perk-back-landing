import { useState } from "react";
import { Wallet, Gift, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import EyebrowLabel from "@/components/shared/EyebrowLabel";
import { cn } from "@/lib/utils";

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: Wallet,
    eyebrow: "One card",
    title: "Every loyalty program in your pocket",
    body: "Carry a single PerkBack card across cafés, restaurants and shops — no more plastic clutter.",
  },
  {
    icon: Gift,
    eyebrow: "Earn faster",
    title: "Points, stamps and birthday perks",
    body: "Collect rewards everywhere you spend. We'll surface offers tuned to where you actually go.",
  },
  {
    icon: MapPin,
    eyebrow: "Discover",
    title: "Find perks near you",
    body: "See live deals from local merchants within walking distance. Tap, save, redeem.",
  },
];

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[90] bg-background flex flex-col safe-top safe-bottom">
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onComplete}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-hero text-primary-foreground flex items-center justify-center mb-8 shadow-hero animate-pop-in">
          <Icon className="w-10 h-10" />
        </div>
        <EyebrowLabel className="mb-2">{slide.eyebrow}</EyebrowLabel>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground max-w-md mb-3 animate-fade-in-up">
          {slide.title}
        </h2>
        <p className="text-muted-foreground text-base max-w-sm leading-relaxed">{slide.body}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 ease-apple",
              i === index ? "w-8 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={() => (isLast ? onComplete() : setIndex(index + 1))}
        >
          {isLast ? "Get started" : "Continue"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
