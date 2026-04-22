import { Award, MapPin, Store } from "lucide-react";

interface MyStoreCardProps {
  merchant: {
    merchant_id: string;
    store_name: string;
    industry_type?: string | null;
    logo_url?: string | null;
    address?: string | null;
    points_balance: number;
    total_spend: number;
    visit_count: number;
    rewardCount: number;
    offerCount: number;
    bannerImage: string;
  };
  onSelect: (merchantId: string) => void;
}

const MyStoreCard = ({ merchant, onSelect }: MyStoreCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(merchant.merchant_id)}
      className="group relative w-[292px] shrink-0 overflow-hidden rounded-[30px] border border-border/40 bg-card text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={merchant.bannerImage}
          alt={merchant.store_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/45 to-foreground/5" />
        <div className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-background/30 bg-card/95 shadow-card">
          {merchant.logo_url ? (
            <img src={merchant.logo_url} alt={merchant.store_name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <Store size={22} className="text-secondary" />
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-primary-foreground">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                {merchant.industry_type || "Business"}
              </p>
              <h4 className="mt-1 truncate text-xl font-bold">{merchant.store_name}</h4>
            </div>
            <div className="rounded-full bg-background/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
              {merchant.points_balance} pts
            </div>
          </div>

          {merchant.address && (
            <p className="mt-2 line-clamp-1 text-xs text-primary-foreground/78 flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0" /> {merchant.address}
            </p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-background/15 bg-background/10 p-3 backdrop-blur-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/55">Rewards</p>
              <p className="mt-1 text-sm font-semibold">{merchant.rewardCount}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/55">Visits</p>
              <p className="mt-1 text-sm font-semibold">{merchant.visit_count}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/55">Spend</p>
              <p className="mt-1 text-sm font-semibold">${merchant.total_spend.toFixed(0)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-primary-foreground/78">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/10 px-2.5 py-1 backdrop-blur-sm">
              <Award size={12} /> {merchant.offerCount} offers live
            </span>
            <span className="font-semibold">Open store</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default MyStoreCard;
