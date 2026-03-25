import ScrollReveal from "@/components/ScrollReveal";
import { Wallet, BarChart3, Megaphone, CreditCard, TrendingUp, Sparkles } from "lucide-react";

const customerBenefits = [
  { icon: CreditCard, title: "One card for everything", desc: "All your loyalty programs in a single digital wallet." },
  { icon: TrendingUp, title: "Track your progress", desc: "See points, stamps, and rewards in real time." },
  { icon: Sparkles, title: "Simple & rewarding", desc: "No more paper cards. Earn automatically at checkout." },
];

const merchantBenefits = [
  { icon: BarChart3, title: "Customer insights", desc: "Understand spending patterns and preferences." },
  { icon: Wallet, title: "Increase repeat visits", desc: "Turn one-time shoppers into loyal regulars." },
  { icon: Megaphone, title: "Easy campaigns", desc: "Launch promotions and offers in minutes." },
];

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
              Benefits
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Built for <span className="text-secondary">everyone</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Customers */}
          <ScrollReveal>
            <div className="bg-card rounded-2xl p-8 shadow-card h-full">
              <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-6">
                For Customers
              </div>
              <div className="space-y-6">
                {customerBenefits.map((b) => (
                  <div key={b.title} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors duration-200">
                      <b.icon className="text-secondary" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{b.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Merchants */}
          <ScrollReveal delay={150}>
            <div className="bg-card rounded-2xl p-8 shadow-card h-full">
              <div className="inline-block px-4 py-1.5 rounded-full bg-accent/30 text-accent-foreground text-sm font-semibold mb-6">
                For Merchants
              </div>
              <div className="space-y-6">
                {merchantBenefits.map((b) => (
                  <div key={b.title} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/30 transition-colors duration-200">
                      <b.icon className="text-accent-foreground" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{b.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
