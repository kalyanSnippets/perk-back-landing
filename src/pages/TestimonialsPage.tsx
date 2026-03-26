import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Star, MessageSquare } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  business_name: string | null;
  message: string;
  rating: number | null;
  profile_image_url: string | null;
}

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      setTestimonials(data || []);
      setLoading(false);
    };
    fetchTestimonials();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">What Our Users Say</h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                Real stories from merchants and customers who love Perk Back.
              </p>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">Loading testimonials...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground">No testimonials yet. Check back soon!</p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <ScrollReveal key={t.id} delay={i * 80}>
                  <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
                    {t.rating && (
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            size={14}
                            className={si < t.rating! ? "text-accent fill-accent" : "text-muted-foreground/20"}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">"{t.message}"</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                      {t.profile_image_url ? (
                        <img src={t.profile_image_url} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center">
                          <span className="text-secondary font-bold text-sm">{t.name[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {[t.role, t.business_name].filter(Boolean).join(" · ") || "Customer"}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TestimonialsPage;
