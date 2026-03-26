import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic loyalty features.",
    features: [
      "Basic loyalty card",
      "Customer registration",
      "Basic points tracking",
      "Up to 50 customers",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/month",
    description: "Everything you need to grow your loyalty program.",
    features: [
      "Everything in Free",
      "Campaigns & promotions",
      "Full transaction history",
      "Rewards management",
      "Customer analytics",
      "AI campaign suggestions",
      "Unlimited customers",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    description: "Advanced features for scaling businesses.",
    features: [
      "Everything in Growth",
      "POS integration readiness",
      "Advanced reports & exports",
      "Gamification features",
      "Birthday offers",
      "Monthly offers",
      "Priority support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Simple, Transparent Pricing</h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                Choose the plan that fits your business. Upgrade or downgrade anytime.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 100}>
                <div
                  className={`relative rounded-2xl p-6 sm:p-7 border transition-all duration-300 hover:-translate-y-1 h-full flex flex-col ${
                    plan.highlighted
                      ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground border-transparent shadow-card-hover scale-[1.02]"
                      : "bg-card border-border/50 shadow-card"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={10} /> Recommended
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className={`text-3xl sm:text-4xl font-bold ${plan.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check size={14} className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-accent" : "text-secondary"}`} />
                        <span className={plan.highlighted ? "text-primary-foreground/90" : "text-foreground/80"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? "secondary" : "hero"}
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <Link to="/get-started">{plan.cta}</Link>
                  </Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
