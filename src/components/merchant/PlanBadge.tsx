import { planLabel, type PlanTier } from "@/lib/features";
import { Crown, Sparkles, Zap } from "lucide-react";

interface PlanBadgeProps {
  plan: PlanTier;
  status: string;
}

const PLAN_STYLES: Record<PlanTier, string> = {
  free: "bg-muted text-muted-foreground",
  growth: "bg-secondary/15 text-secondary",
  pro: "bg-primary/15 text-primary",
};

const PLAN_ICON: Record<PlanTier, React.ElementType> = {
  free: Zap,
  growth: Sparkles,
  pro: Crown,
};

const PlanBadge = ({ plan, status }: PlanBadgeProps) => {
  const Icon = PLAN_ICON[plan];
  const statusLabel = status !== "active" ? ` · ${status.charAt(0).toUpperCase() + status.slice(1)}` : "";

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${PLAN_STYLES[plan]}`}>
      <Icon size={12} />
      {planLabel(plan)}{statusLabel}
    </span>
  );
};

export default PlanBadge;
