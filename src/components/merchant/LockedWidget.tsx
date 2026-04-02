import { Lock } from "lucide-react";
import { planLabel, getFeature, type PlanTier } from "@/lib/features";

interface LockedWidgetProps {
  featureKey: string;
  label?: string;
  value?: string;
  icon?: React.ElementType;
}

const LockedWidget = ({ featureKey, label, value, icon: Icon }: LockedWidgetProps) => {
  const feature = getFeature(featureKey);
  const plan = feature?.minimumPlan ?? "pro";

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 relative overflow-hidden opacity-60">
      <div className="absolute inset-0 backdrop-blur-[2px] bg-card/40 z-10 flex flex-col items-center justify-center gap-1.5">
        <Lock size={16} className="text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground">
          {planLabel(plan as PlanTier)} Plan
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
          {Icon ? <Icon size={16} className="text-muted-foreground" /> : <Lock size={16} className="text-muted-foreground" />}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value ?? "—"}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label ?? feature?.name ?? featureKey}</p>
    </div>
  );
};

export default LockedWidget;
