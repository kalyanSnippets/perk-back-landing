import { cn } from "@/lib/utils";
import { Wallet, ScanLine, type LucideIcon } from "lucide-react";
import EyebrowLabel from "./EyebrowLabel";

interface HeroPointsCardProps {
  points: number | string;
  tier?: string;
  progressPercent?: number; // 0–100
  progressLabel?: string;
  nextTierLabel?: string;
  primaryAction?: { label: string; icon?: LucideIcon; onClick?: () => void };
  secondaryAction?: { label: string; icon?: LucideIcon; onClick?: () => void };
  className?: string;
}

/**
 * The signature gradient hero card used on customer Home / Card screens.
 * Decorative rings + tabular-num points + tier progress + two CTAs.
 */
export const HeroPointsCard = ({
  points,
  tier,
  progressPercent = 0,
  progressLabel,
  nextTierLabel,
  primaryAction = { label: "Open card", icon: Wallet },
  secondaryAction = { label: "Scan to earn", icon: ScanLine },
  className,
}: HeroPointsCardProps) => {
  const PrimaryIcon = primaryAction.icon ?? Wallet;
  const SecondaryIcon = secondaryAction.icon ?? ScanLine;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-hero text-primary-foreground p-5 shadow-hero",
        className,
      )}
    >
      {/* decorative rings */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full border border-primary-foreground/10" />
      <div className="pointer-events-none absolute -bottom-12 -right-5 w-36 h-36 rounded-full bg-primary-foreground/[0.05]" />

      <EyebrowLabel className="text-primary-foreground/60">Total points</EyebrowLabel>

      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-[42px] font-bold leading-none tabular-nums tracking-tight animate-pop-in">
          {typeof points === "number" ? points.toLocaleString() : points}
        </div>
        <div className="text-sm opacity-70">pts</div>
      </div>

      {(tier || progressPercent > 0) && (
        <div className="mt-4">
          <div className="flex justify-between text-[10px] opacity-80 mb-1.5">
            <span>{progressLabel ?? tier}</span>
            {nextTierLabel && <span>{nextTierLabel}</span>}
          </div>
          <div className="h-1.5 rounded-full bg-primary-foreground/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-apple"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="flex-1 h-10 rounded-md bg-card text-primary text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform duration-200 ease-apple active:scale-95"
        >
          <PrimaryIcon className="w-[15px] h-[15px]" /> {primaryAction.label}
        </button>
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className="flex-1 h-10 rounded-md bg-primary-foreground/[0.12] text-primary-foreground border border-primary-foreground/20 text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform duration-200 ease-apple active:scale-95"
        >
          <SecondaryIcon className="w-[15px] h-[15px]" /> {secondaryAction.label}
        </button>
      </div>
    </div>
  );
};

export default HeroPointsCard;
