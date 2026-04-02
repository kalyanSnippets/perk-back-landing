import { AlertTriangle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerLimitBannerProps {
  currentCount: number;
  limit: number;
}

const CustomerLimitBanner = ({ currentCount, limit }: CustomerLimitBannerProps) => {
  if (limit === Infinity || currentCount < limit * 0.8) return null;

  const atLimit = currentCount >= limit;

  return (
    <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
      atLimit
        ? "bg-destructive/10 border-destructive/30"
        : "bg-accent/10 border-accent/30"
    }`}>
      <AlertTriangle size={18} className={atLimit ? "text-destructive" : "text-accent-foreground"} />
      <p className="text-sm text-foreground flex-1">
        {atLimit
          ? `You've reached your Free plan limit of ${limit} customers.`
          : `You're approaching your Free plan limit (${currentCount}/${limit} customers).`}
      </p>
      <Button size="sm" variant="hero" className="gap-1.5 shrink-0 text-xs">
        <ArrowUpCircle size={14} />
        Upgrade to Growth
      </Button>
    </div>
  );
};

export default CustomerLimitBanner;
