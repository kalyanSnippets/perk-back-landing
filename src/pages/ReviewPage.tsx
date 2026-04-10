import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import StarRating from "@/components/StarRating";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

const ReviewPage = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error("Please write a review"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("testimonials").insert({
      name: user?.user_metadata?.full_name || user?.user_metadata?.name || "Anonymous",
      message: message.trim(),
      rating,
      is_published: false,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thank you! Your testimonial will be reviewed.");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-lg pt-20 sm:pt-24">
        <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
          {submitted ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto text-accent mb-3" />
              <p className="text-base font-semibold text-foreground">Review Submitted!</p>
              <p className="text-sm text-muted-foreground mt-1">It will appear on the site once approved.</p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-secondary" /> Write a Review
              </h1>
              <div className="space-y-4">
                <StarRating rating={rating} onChange={setRating} />
                <textarea
                  placeholder="Tell us about your experience with PerkBack..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px] resize-none"
                  maxLength={500}
                />
                <Button onClick={handleSubmit} disabled={submitting} variant="hero" className="w-full gap-2">
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
