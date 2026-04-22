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
      className="group relative w-[292px] shrink-0 overflow-hidden rounded-[28px] border border-border/30 bg-card text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={merchant.bannerImage}
          alt={merchant.store_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
          <div className="rounded-[24px] border border-background/15 bg-background/10 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-background/20 bg-card/95 shadow-card">
                {merchant.logo_url ? (
                  <img src={merchant.logo_url} alt={merchant.store_name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Store size={20} className="text-secondary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                  {merchant.industry_type || "Business"}
                </p>
                <h4 className="mt-1 truncate text-lg font-bold">{merchant.store_name}</h4>
                {merchant.address && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-primary-foreground/78 line-clamp-1">
                    <MapPin size={12} className="shrink-0" /> {merchant.address}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 text-xs text-primary-foreground/84">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/10 px-2.5 py-1 backdrop-blur-sm">
                <Award size={12} /> {merchant.rewardCount} rewards
              </span>
              <span className="rounded-full bg-background/10 px-2.5 py-1 font-semibold backdrop-blur-sm">
                {merchant.points_balance} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default MyStoreCard;
