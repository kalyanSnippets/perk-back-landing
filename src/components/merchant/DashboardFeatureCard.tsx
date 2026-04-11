import { useNavigate } from "react-router-dom";
import { Lock, LucideIcon } from "lucide-react";
import { planLabel, getRequiredPlan, type PlanTier } from "@/lib/features";

interface DashboardFeatureCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  route?: string;
  featureKey?: string;
  isLocked: boolean;
  onClick?: () => void;
}

const PLAN_COLORS: Record<PlanTier, string> = {
  free: "bg-muted text-muted-foreground",
  growth: "bg-secondary/15 text-secondary",
  pro: "bg-primary/15 text-primary",
};

const ACCENT_BORDERS = [
  "border-l-secondary",
  "border-l-coral",
  "border-l-accent",
  "border-l-teal",
  "border-l-emerald-accent",
];

const DashboardFeatureCard = ({
  icon: Icon,
  label,
  description,
  route,
  featureKey,
  isLocked,
  onClick,
}: DashboardFeatureCardProps) => {
  const navigate = useNavigate();
  const requiredPlan = featureKey ? getRequiredPlan(featureKey) : "free";

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (route) {
      navigate(route);
    }
  };

  // Deterministic accent border based on label
  const accentIdx = label.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % ACCENT_BORDERS.length;
  const accentBorder = ACCENT_BORDERS[accentIdx];

  return (
    <button
      onClick={handleClick}
      className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-l-4 border transition-all duration-200 text-left w-full ${
        isLocked
          ? "bg-muted/30 border-border/30 border-l-border opacity-70 cursor-pointer hover:opacity-80"
          : `bg-card border-border/50 ${accentBorder} shadow-card hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer`
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isLocked ? "bg-muted/60" : "bg-gradient-to-br from-primary/10 to-secondary/10"
        }`}>
          <Icon size={18} className={isLocked ? "text-muted-foreground" : "text-secondary"} />
        </div>
        {isLocked && (
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-muted-foreground" />
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[requiredPlan]}`}>
              {planLabel(requiredPlan)}
            </span>
          </div>
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
          {label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
};

export default DashboardFeatureCard;
