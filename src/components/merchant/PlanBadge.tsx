import { planLabel, type PlanTier } from "@/lib/features";
import { Crown, Sparkles, Zap } from "lucide-react";

interface PlanBadgeProps {
  plan: PlanTier;
  status: string;
  variant?: "default" | "banner";
}

const PLAN_STYLES: Record<PlanTier, string> = {
  free: "bg-muted text-muted-foreground",
  growth: "bg-secondary/15 text-secondary",
  pro: "bg-primary/15 text-primary",
};

const PLAN_BANNER_STYLES: Record<PlanTier, string> = {
  free: "bg-primary-foreground/20 text-primary-foreground backdrop-blur-sm",
  growth: "bg-primary-foreground/25 text-primary-foreground backdrop-blur-sm",
  pro: "bg-primary-foreground/25 text-primary-foreground backdrop-blur-sm",
};

const PLAN_ICON: Record<PlanTier, React.ElementType> = {
  free: Zap,
  growth: Sparkles,
  pro: Crown,
};

const PlanBadge = ({ plan, status, variant = "default" }: PlanBadgeProps) => {
  const Icon = PLAN_ICON[plan];
  const statusLabel = status !== "active" ? ` · ${status.charAt(0).toUpperCase() + status.slice(1)}` : "";
  const styles = variant === "banner" ? PLAN_BANNER_STYLES[plan] : PLAN_STYLES[plan];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${styles}`}>
      <Icon size={12} />
      {planLabel(plan)}{statusLabel}
    </span>
  );
};

export default PlanBadge;
