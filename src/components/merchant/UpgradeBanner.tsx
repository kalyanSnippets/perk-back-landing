import { Sparkles, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { planLabel, type PlanTier } from "@/lib/features";

interface UpgradeBannerProps {
  currentPlan: PlanTier;
}

const MESSAGES: Record<string, { text: string; target: PlanTier }> = {
  free: {
    text: "Unlock campaigns, analytics, and AI suggestions with Growth.",
    target: "growth",
  },
  growth: {
    text: "Upgrade to Pro for POS integration, gamification, and birthday offers.",
    target: "pro",
  },
};

const UpgradeBanner = ({ currentPlan }: UpgradeBannerProps) => {
  const msg = MESSAGES[currentPlan];
  if (!msg) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Sparkles size={18} className="text-primary" />
      </div>
      <p className="text-sm text-foreground flex-1">{msg.text}</p>
      <Button size="sm" variant="hero" className="gap-1.5 shrink-0 text-xs">
        <ArrowUpCircle size={14} />
        Upgrade to {planLabel(msg.target)}
      </Button>
    </div>
  );
};

export default UpgradeBanner;
