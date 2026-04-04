import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Megaphone, Target, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Header from "@/components/Header";
import BackToDashboard from "@/components/merchant/BackToDashboard";
import LockedFeature from "@/components/merchant/LockedFeature";
import ScrollReveal from "@/components/ScrollReveal";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

interface Suggestion {
  title: string;
  description: string;
  target_audience: string;
  expected_impact: string;
  confidence: string;
}

const confidenceColor: Record<string, string> = {
  high: "bg-green-500/15 text-green-600",
  medium: "bg-yellow-500/15 text-yellow-600",
  low: "bg-red-500/15 text-red-600",
};

const MerchantAISuggestions = () => {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [creatingIdx, setCreatingIdx] = useState<number | null>(null);
  const { canAccess, loading: subLoading } = useMerchantSubscription(merchantId);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/get-started"); return; }
      const { data: m } = await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
      if (!m) { navigate("/get-started"); return; }
      setMerchantId(m.id);
      setLoading(false);
    })();
  }, [navigate]);

  const generateSuggestions = async () => {
    if (!merchantId) return;
    setGenerating(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-merchant-assistant", {
        body: { merchant_id: merchantId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setSuggestions(data?.suggestions || []);
      if (!data?.suggestions?.length) toast.info("No suggestions generated. Add more transactions for better results.");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate suggestions");
    } finally {
      setGenerating(false);
    }
  };

  const createCampaign = async (s: Suggestion, idx: number) => {
    if (!merchantId) return;
    setCreatingIdx(idx);
    const { error } = await supabase.from("campaigns").insert({
      merchant_id: merchantId,
      title: s.title,
      description: s.description,
      ai_generated: true,
      expected_impact: s.expected_impact,
      confidence_score: s.confidence === "high" ? 0.9 : s.confidence === "medium" ? 0.6 : 0.3,
      target_segment: s.target_audience,
    });
    setCreatingIdx(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Campaign "${s.title}" created!`);
  };

  if (loading || subLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-6 pt-20 sm:pt-24 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <BackToDashboard />
          {!canAccess("ai_suggestions") ? (
            <LockedFeature featureKey="ai_suggestions" />
          ) : (
            <>
              <ScrollReveal>
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground">AI Suggestions</h1>
                  <Button variant="hero" size="sm" className="gap-1.5" onClick={generateSuggestions} disabled={generating}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {generating ? "Analyzing..." : "Generate"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">AI analyzes your transaction data and suggests campaigns to boost engagement.</p>
              </ScrollReveal>

              {suggestions.length === 0 && !generating && (
                <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card text-center">
                  <Sparkles size={40} className="mx-auto mb-3 text-secondary/40" />
                  <p className="text-sm text-muted-foreground">Click "Generate" to get AI-powered campaign suggestions</p>
                  <p className="text-xs text-muted-foreground mt-1">Based on your transaction data, purchase patterns, and customer behaviour.</p>
                </div>
              )}

              {generating && (
                <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card text-center">
                  <Loader2 size={32} className="mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing your transaction data...</p>
                  <p className="text-xs text-muted-foreground mt-1">This may take a few seconds.</p>
                </div>
              )}

              {suggestions.map((s, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Megaphone size={16} className="text-primary shrink-0" />
                          <p className="text-sm font-bold text-foreground">{s.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${confidenceColor[s.confidence] || ""}`}>
                            {s.confidence}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground"><Target size={12} /> {s.target_audience}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp size={12} /> {s.expected_impact}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => createCampaign(s, i)}
                      disabled={creatingIdx === i}
                    >
                      <Plus size={12} /> {creatingIdx === i ? "Creating..." : "Create Campaign"}
                    </Button>
                  </div>
                </ScrollReveal>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantAISuggestions;
