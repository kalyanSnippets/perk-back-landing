import ScrollReveal from "@/components/ScrollReveal";
import { Star, Coffee, Tag } from "lucide-react";

const rewards = [
  {
    icon: Star,
    title: "Points System",
    description: "Earn 1 point per dollar spent. Redeem points for discounts, freebies, and exclusive perks.",
    progress: 72,
    progressLabel: "720 / 1,000 pts",
    color: "from-secondary to-primary",
    accentBorder: "border-l-secondary",
    iconBg: "bg-secondary/15",
    iconColor: "text-secondary",
  },
  {
    icon: Coffee,
    title: "Coffee Stamps",
    description: "Collect stamps with every coffee purchase. Your 10th coffee is always free!",
    progress: 50,
    progressLabel: "5 / 10 stamps",
    stamps: true,
    color: "from-accent to-gold",
    accentBorder: "border-l-accent",
    iconBg: "bg-accent/20",
    iconColor: "text-accent-foreground",
  },
  {
    icon: Tag,
    title: "Merchant Offers",
    description: "Unlock exclusive deals and limited-time offers from your favorite local stores.",
    progress: 30,
    progressLabel: "3 offers redeemed",
    color: "from-coral to-warm-amber",
    accentBorder: "border-l-coral",
    iconBg: "bg-coral/15",
    iconColor: "text-coral",
  },
];

const RewardsShowcase = () => {
  return (
    <section id="rewards" className="relative py-20 md:py-28 overflow-hidden">
      {/* Floating shapes */}
      <div className="floating-circle w-10 h-10 bg-secondary/10 top-[12%] left-[4%]" style={{ animationDelay: "0.5s" }} />
      <div className="floating-dot w-4 h-4 bg-accent/20 bottom-[18%] right-[6%]" style={{ animationDelay: "2s" }} />

      <div className="container mx-auto px-4 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-foreground bg-accent/30 inline-block px-4 py-1 rounded-full mb-3">
              Rewards
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Every purchase brings you closer to{" "}
              <span className="text-secondary">something great</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {rewards.map((reward, i) => (
            <ScrollReveal key={reward.title} delay={i * 150}>
              <div className={`bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300 group h-full flex flex-col border-l-4 ${reward.accentBorder}`}>
                <div className={`w-14 h-14 rounded-full ${reward.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <reward.icon className={reward.iconColor} size={26} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{reward.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{reward.description}</p>

                {/* Stamps visual */}
                {reward.stamps && (
                  <div className="flex gap-2 mb-4">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all duration-300 ${
                          j < 5
                            ? "bg-accent border-accent text-accent-foreground animate-pulse-once"
                            : "border-border text-muted-foreground"
                        }`}
                        style={{ animationDelay: `${j * 0.1}s` }}
                      >
                        {j < 5 ? "☕" : j + 1}
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-medium">{reward.progressLabel}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${reward.color} animate-progress`}
                      style={{ "--progress-width": `${reward.progress}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RewardsShowcase;
