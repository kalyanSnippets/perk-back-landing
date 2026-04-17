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
}

const TIERS = [
  { name: "VIP",    min: 5000, gradient: "from-purple-500 via-fuchsia-500 to-pink-500",   icon: Crown,  ring: "ring-purple-400/40" },
  { name: "Gold",   min: 1500, gradient: "from-yellow-400 via-amber-500 to-orange-500",   icon: Trophy, ring: "ring-amber-400/40" },
  { name: "Silver", min: 500,  gradient: "from-slate-300 via-slate-400 to-slate-500",     icon: Award,  ring: "ring-slate-400/40" },
  { name: "Bronze", min: 0,    gradient: "from-amber-700 via-orange-700 to-amber-800",    icon: Medal,  ring: "ring-amber-700/40" },
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
  const todayMs = today.getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // streak counts back from most recent visit, allowing today or yesterday as start
  const diffFromToday = (todayMs - uniqueDays[0]) / ONE_DAY;
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const gap = (uniqueDays[i - 1] - uniqueDays[i]) / ONE_DAY;
    if (gap === 1) streak++;
    else break;
  }
  return streak;
};

const MerchantStatusCard = ({ storeName, pointsBalance, merchantId, transactions }: Props) => {
  const tier = getTier(pointsBalance);
  const nextTier = getNextTier(pointsBalance);
  const TierIcon = tier.icon;
  const streak = computeStreak(transactions, merchantId);
  const pointsToNext = nextTier ? nextTier.min - pointsBalance : 0;
  const progress = nextTier ? Math.min(100, ((pointsBalance - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-card border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Your Status · {storeName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tier badge */}
        <div className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${tier.gradient} text-white shadow-lg ring-2 ${tier.ring}`}>
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white/10 blur-lg" />
          <div className="relative flex items-center gap-2 mb-1">
            <TierIcon size={18} className="drop-shadow" />
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Tier</p>
          </div>
          <p className="relative text-2xl font-extrabold drop-shadow-sm">{tier.name}</p>
          <p className="relative text-[10px] opacity-90 mt-0.5 tabular-nums">{pointsBalance.toLocaleString()} pts</p>
        </div>

        {/* Visit streak */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white shadow-lg ring-2 ring-orange-400/40">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white/10 blur-lg" />
          <div className="relative flex items-center gap-2 mb-1">
            <Flame size={18} className="drop-shadow" />
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Streak</p>
          </div>
          <p className="relative text-2xl font-extrabold drop-shadow-sm tabular-nums">{streak} <span className="text-sm font-bold opacity-90">{streak === 1 ? "day" : "days"}</span></p>
          <p className="relative text-[10px] opacity-90 mt-0.5">{streak >= 2 ? "Keep the heat 🔥" : "Visit again to build streak"}</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Next: <span className="font-semibold text-foreground">{nextTier.name}</span></span>
            <span className="font-semibold text-primary tabular-nums">{pointsToNext.toLocaleString()} pts to go</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${nextTier.gradient} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantStatusCard;
