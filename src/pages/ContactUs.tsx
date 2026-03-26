import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Mail, User, Building2, MessageSquare } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  business_name: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", business_name: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: result.data.name,
        email: result.data.email,
        business_name: result.data.business_name || null,
        message: result.data.message,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Contact Us</h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
                Have a question or want to partner with Perk Back? We'd love to hear from you.
              </p>
            </div>
          </ScrollReveal>

          {submitted ? (
            <ScrollReveal>
              <div className="bg-card rounded-2xl p-8 sm:p-10 shadow-card border border-border/50 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary/15 flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-secondary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Message Sent!</h2>
                <p className="text-muted-foreground text-sm">
                  Thank you for reaching out. We'll get back to you within 24-48 hours.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal delay={100}>
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 sm:p-8 shadow-card border border-border/50 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground" /> Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail size={14} className="text-muted-foreground" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name" className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-muted-foreground" /> Business Name (optional)
                  </Label>
                  <Input
                    id="business_name"
                    placeholder="Your business name"
                    value={form.business_name}
                    onChange={(e) => handleChange("business_name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-muted-foreground" /> Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help?"
                    rows={5}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                  />
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                  <Send size={16} />
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </ScrollReveal>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
