import { Lock, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { planLabel, getFeature, type PlanTier } from "@/lib/features";

interface LockedFeatureProps {
  featureKey: string;
  requiredPlan?: PlanTier;
}

const LockedFeature = ({ featureKey, requiredPlan }: LockedFeatureProps) => {
  const feature = getFeature(featureKey);
  const plan = requiredPlan ?? feature?.minimumPlan ?? "pro";

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[300px] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
        <Lock size={24} className="text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold text-foreground">
        {feature?.name || featureKey}
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        {feature?.upgradeDescription || `This feature requires a higher plan.`}
      </p>
      <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
        Available on {planLabel(plan)}
      </span>
      <Button variant="hero" className="gap-2 mt-2">
        <ArrowUpCircle size={16} />
        Upgrade to {planLabel(plan)}
      </Button>
    </div>
  );
};

export default LockedFeature;
