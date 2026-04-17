import { Flame, Trophy, Crown, Award, Medal } from "lucide-react";

interface Tx {
  merchant_id: string | null;
  transaction_date: string;
}

interface Props {
  storeName: string;
  pointsBalance: number;
  merchantId: string;
  transactions: Tx[];
  showTier?: boolean;
  showStreak?: boolean;
}

const TIERS = [
  { name: "VIP",    min: 5000, color: "text-purple-500",  bar: "from-purple-500 to-fuchsia-500", icon: Crown },
  { name: "Gold",   min: 1500, color: "text-amber-500",   bar: "from-yellow-400 to-amber-500",   icon: Trophy },
  { name: "Silver", min: 500,  color: "text-slate-400",   bar: "from-slate-300 to-slate-500",    icon: Award },
  { name: "Bronze", min: 0,    color: "text-amber-700",   bar: "from-amber-700 to-orange-700",   icon: Medal },
];

const getTier = (pts: number) => TIERS.find(t => pts >= t.min) ?? TIERS[TIERS.length - 1];
const getNextTier = (pts: number) => [...TIERS].reverse().find(t => t.min > pts) ?? null;

const computeStreak = (txs: Tx[], merchantId: string): number => {
  const dates = txs
    .filter(t => t.merchant_id === merchantId)
    .map(t => {
      const d = new Date(t.transaction_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
  if (dates.length === 0) return 0;
  const uniqueDays = Array.from(new Set(dates)).sort((a, b) => b - a);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const diffFromToday = (today.getTime() - uniqueDays[0]) / ONE_DAY;
  if (diffFromToday > 1) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const gap = (uniqueDays[i - 1] - uniqueDays[i]) / ONE_DAY;
    if (gap === 1) streak++;
    else break;
  }
  return streak;
};

const MerchantStatusCard = ({ storeName, pointsBalance, merchantId, transactions, showTier = true, showStreak = true }: Props) => {
  if (!showTier && !showStreak) return null;

  const tier = getTier(pointsBalance);
  const nextTier = getNextTier(pointsBalance);
  const TierIcon = tier.icon;
  const streak = computeStreak(transactions, merchantId);
  const pointsToNext = nextTier ? nextTier.min - pointsBalance : 0;
  const progress = nextTier ? Math.min(100, ((pointsBalance - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  return (
    <div className="bg-card rounded-xl px-4 py-3 border border-border/50 shadow-sm flex items-center gap-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0 hidden sm:block">{storeName}</p>

      {showTier && (
        <div className="flex items-center gap-2 shrink-0">
          <TierIcon size={14} className={tier.color} />
          <span className={`text-xs font-bold ${tier.color}`}>{tier.name}</span>
        </div>
      )}

      {showTier && nextTier && (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${nextTier.bar} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">{pointsToNext.toLocaleString()} → {nextTier.name}</span>
        </div>
      )}

      {showStreak && streak > 0 && (
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <Flame size={13} className="text-orange-500" />
          <span className="text-xs font-semibold text-foreground tabular-nums">{streak}d</span>
        </div>
      )}
    </div>
  );
};

export default MerchantStatusCard;
