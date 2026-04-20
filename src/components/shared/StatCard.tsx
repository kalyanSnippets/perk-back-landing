import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: LucideIcon;
  iconColor?: "primary" | "secondary" | "accent" | "success" | "flash";
  className?: string;
}

const iconColorMap = {
  primary: "bg-primary/15 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  accent: "bg-accent/30 text-accent-foreground",
  success: "bg-success/15 text-success",
  flash: "bg-flash/15 text-flash",
} as const;

/**
 * Compact stat card used on merchant dashboard. Icon tile + big tabular
 * number + label + optional delta. Matches prototype look.
 */
export const StatCard = ({
  label,
  value,
  delta,
  deltaPositive = true,
  icon: Icon,
  iconColor = "primary",
  className,
}: StatCardProps) => (
  <div
    className={cn(
      "rounded-lg border border-border bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow duration-300 ease-apple",
      className,
    )}
  >
    <div className="flex items-start justify-between mb-3">
      {Icon && (
        <div
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center",
            iconColorMap[iconColor],
          )}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
      )}
    </div>
    <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground leading-none">
      {value}
    </div>
    <div className="text-[11px] text-muted-foreground mt-1.5">{label}</div>
    {delta && (
      <div
        className={cn(
          "text-[11px] font-semibold mt-2",
          deltaPositive ? "text-success" : "text-flash",
        )}
      >
        {delta}
      </div>
    )}
  </div>
);

export default StatCard;
