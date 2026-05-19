import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Users, Store, Shield, Heart, Zap } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import ScrollReveal from "@/components/ScrollReveal";
import PublicPageFrame from "@/components/shared/PublicPageFrame";
import { useEmbeddedPublicPage } from "@/hooks/useEmbeddedPublicPage";

const AboutUs = () => {
  const { isEmbedded, backHref } = useEmbeddedPublicPage();

  return (
    <PublicPageFrame isEmbedded={isEmbedded} backHref={backHref} title="About Us">
      <section className={`${isEmbedded ? "pb-10 pt-2" : "pt-4 pb-12 sm:pt-8 sm:pb-16"}`}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-light-blue via-background to-background" />
        <div className="container mx-auto max-w-3xl px-4 text-center lg:px-8">
          <ScrollReveal>
            <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
              About{" "}
              <img src={perkbackLogo} alt="Perk Back" className="inline h-8 w-auto align-middle sm:h-10" />
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Perk Back is a modern loyalty platform that connects customers and local businesses.
              We believe every purchase should be rewarding — for both sides of the counter.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4 lg:px-8">
          <ScrollReveal>
            <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card sm:p-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
                <Heart className="shrink-0 text-accent" size={24} />
                Our Mission
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                We're on a mission to help local businesses thrive by turning one-time visitors into loyal regulars.
                Perk Back makes it effortless for customers to earn points, stamps, and exclusive perks across
                all their favourite stores — all from a single digital loyalty card.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4 lg:px-8">
          <ScrollReveal>
            <h2 className="mb-8 text-center text-xl font-bold text-foreground sm:text-2xl">What We Stand For</h2>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {[
              { icon: Users, title: "Customer First", desc: "Every feature is designed with the customer experience in mind." },
              { icon: Store, title: "Local Business Love", desc: "We empower merchants with tools to grow and retain customers." },
              { icon: Shield, title: "Privacy & Security", desc: "Your data is encrypted and never shared with third parties." },
              { icon: Zap, title: "Simplicity", desc: "Every brand, beautifully presented — no generic cards, just rewards." },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card transition-transform duration-200 hover:-translate-y-1 sm:p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                    <item.icon size={20} className="text-secondary" />
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-foreground sm:text-base">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center lg:px-8">
          <ScrollReveal>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
              <Star className="fill-accent text-accent" size={28} />
            </div>
            <h2 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">Why Perk Back?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Traditional loyalty programs are fragmented — different cards, different apps, different rules.
              Perk Back unifies it all. Customers carry one digital card. Merchants get a simple dashboard.
              Everyone earns more, together.
            </p>
            <Button variant="hero" size="lg" className="mt-6" asChild>
              <Link to="/get-started">Get Started Today</Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageFrame>
  );
};

export default AboutUs;
