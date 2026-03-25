import ScrollReveal from "@/components/ScrollReveal";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Coffee Lover",
    text: "I used to have a wallet full of stamp cards. Now everything is in one place — and I actually remember to collect my rewards!",
    stars: 5,
  },
  {
    name: "James T.",
    role: "Café Owner",
    text: "Since adding Perk Back, our repeat visits are up 35%. The dashboard makes it so easy to see what's working.",
    stars: 5,
  },
  {
    name: "Priya K.",
    role: "Regular Shopper",
    text: "Love that I can earn points across different stores. The free coffee milestone keeps me coming back!",
    stars: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Loved by <span className="text-secondary">customers & merchants</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 150}>
              <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={16} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed flex-1 mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
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

export default Testimonials;
