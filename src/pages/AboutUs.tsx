import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Users, Store, Shield, Heart, Zap } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.png";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-light-blue via-background to-background -z-10" />
        <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
          <ScrollReveal>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
              About{" "}
              <img src={perkbackLogo} alt="Perk Back" className="h-8 sm:h-10 w-auto inline align-middle" />
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Perk Back is a modern loyalty platform that connects customers and local businesses.
              We believe every purchase should be rewarding — for both sides of the counter.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <ScrollReveal>
            <div className="bg-card rounded-2xl p-6 sm:p-10 shadow-card border border-border/50">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Heart className="text-accent shrink-0" size={24} />
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                We're on a mission to help local businesses thrive by turning one-time visitors into loyal regulars.
                Perk Back makes it effortless for customers to earn points, stamps, and exclusive perks across
                all their favourite stores — all from a single digital loyalty card.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <ScrollReveal>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-8">What We Stand For</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: Users, title: "Customer First", desc: "Every feature is designed with the customer experience in mind." },
              { icon: Store, title: "Local Business Love", desc: "We empower merchants with tools to grow and retain customers." },
              { icon: Shield, title: "Privacy & Security", desc: "Your data is encrypted and never shared with third parties." },
              { icon: Zap, title: "Simplicity", desc: "One card, one wallet — no complexity, just rewards." },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50 hover:-translate-y-1 transition-transform duration-200">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
                    <item.icon size={20} className="text-secondary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">{item.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it helps */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <ScrollReveal>
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
              <Star className="text-accent fill-accent" size={28} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Why Perk Back?</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
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

      <Footer />
    </div>
  );
};

export default AboutUs;
