import ScrollReveal from "@/components/ScrollReveal";
import { UserPlus, ScanBarcode, Gift } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign up & get your card",
    description: "Create your free account and receive your digital loyalty card instantly.",
  },
  {
    icon: ScanBarcode,
    title: "Show barcode at checkout",
    description: "Present your barcode or loyalty number when you pay at any partner store.",
  },
  {
    icon: Gift,
    title: "Earn rewards instantly",
    description: "Collect points, stamps, and exclusive perks — automatically added to your wallet.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Start earning in{" "}
              <span className="text-secondary">3 simple steps</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 150}>
              <div className="relative bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300 text-center group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center shadow-sm">
                  {i + 1}
                </div>
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="text-primary-foreground" size={28} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
