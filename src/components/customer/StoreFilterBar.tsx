import { Store } from "lucide-react";

import { cn } from "@/lib/utils";

interface StoreFilterMerchant {
  merchant_id: string;
  store_name: string;
  points_balance: number;
  logo_url?: string | null;
}

interface StoreFilterBarProps {
  merchants: StoreFilterMerchant[];
  selectedMerchantId: string | null;
  onSelect: (merchantId: string | null) => void;
}

const StoreFilterBar = ({ merchants, selectedMerchantId, onSelect }: StoreFilterBarProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold whitespace-nowrap transition-all",
          selectedMerchantId === null
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border/60 bg-background text-foreground hover:bg-muted/60",
        )}
      >
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background/15 px-1.5 text-[10px] font-bold">
          All
        </span>
        <span>All Stores</span>
      </button>

      {merchants.map((merchant) => {
        const isSelected = selectedMerchantId === merchant.merchant_id;

        return (
          <button
            key={merchant.merchant_id}
            type="button"
            onClick={() => onSelect(isSelected ? null : merchant.merchant_id)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-2.5 pr-3 text-left text-xs font-semibold whitespace-nowrap transition-all",
              isSelected
                ? "border-primary bg-primary/10 text-foreground shadow-sm"
                : "border-border/60 bg-background text-foreground hover:bg-muted/60",
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted shrink-0">
              {merchant.logo_url ? (
                <img src={merchant.logo_url} alt={merchant.store_name} className="h-full w-full object-cover" />
              ) : (
                <Store size={12} className="text-secondary" />
              )}
            </span>

            <span className="max-w-[110px] truncate">{merchant.store_name}</span>

            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {merchant.points_balance}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StoreFilterBar;