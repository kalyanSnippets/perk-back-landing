import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MerchantLoyaltyCard, { MerchantCardDesign, DEFAULT_CARD_DESIGN } from "./MerchantLoyaltyCard";
import { Store, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface MerchantInfo {
  merchant_id: string;
  store_name: string;
  logo_url?: string | null;
}

interface Props {
  customerId: string;
  fullName: string | null;
  loyaltyCardNumber: string | null;
  merchants: Array<MerchantInfo & { points_balance: number }>;
}

const MerchantCardWallet = ({ customerId, fullName, loyaltyCardNumber, merchants }: Props) => {
  const [designs, setDesigns] = useState<Record<string, MerchantCardDesign>>({});
  const [activeIndex, setActiveIndex] = useState(0);

  const merchantIds = useMemo(() => merchants.map((m) => m.merchant_id), [merchants]);

  useEffect(() => {
    let cancelled = false;
    if (merchantIds.length === 0) {
      setDesigns({});
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("merchant_card_designs" as any)
        .select("*")
        .in("merchant_id", merchantIds);
      if (cancelled) return;
      const map: Record<string, MerchantCardDesign> = {};
      ((data as any[]) || []).forEach((row) => {
        map[row.merchant_id] = {
          primary_color: row.primary_color,
          secondary_color: row.secondary_color,
          text_color: row.text_color,
          background_image_url: row.background_image_url,
          card_style: row.card_style,
          show_logo: row.show_logo,
          show_points: row.show_points,
          barcode_format: row.barcode_format,
        };
      });
      setDesigns(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [merchantIds.join(",")]);

  if (merchants.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10">
          <Store size={20} className="text-secondary" />
        </div>
        <h3 className="text-sm font-bold text-foreground">No cards yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Visit a store on Explore to add your first loyalty card.
        </p>
        <Button asChild size="sm" variant="hero" className="mt-4">
          <Link to="/access-card?tab=explore">Explore stores</Link>
        </Button>
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, merchants.length - 1);
  const active = merchants[safeIndex];
  const design = designs[active.merchant_id] ?? DEFAULT_CARD_DESIGN;

  return (
    <div className="space-y-4">
      <MerchantLoyaltyCard
        storeName={active.store_name}
        storeLogoUrl={active.logo_url}
        fullName={fullName}
        loyaltyCardNumber={loyaltyCardNumber}
        pointsBalance={active.points_balance}
        design={design}
      />

      {merchants.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full p-0"
            onClick={() => setActiveIndex((i) => (i - 1 + merchants.length) % merchants.length)}
            aria-label="Previous card"
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-center gap-1.5">
            {merchants.map((m, idx) => (
              <button
                key={m.merchant_id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all ${idx === safeIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
                aria-label={`Show ${m.store_name} card`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full p-0"
            onClick={() => setActiveIndex((i) => (i + 1) % merchants.length)}
            aria-label="Next card"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {merchants.length > 1 && (
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max gap-2">
            {merchants.map((m, idx) => (
              <button
                key={m.merchant_id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  idx === safeIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/50 bg-card text-foreground hover:bg-muted/40"
                }`}
              >
                {m.logo_url ? (
                  <img src={m.logo_url} alt="" className="h-4 w-4 rounded object-contain" />
                ) : (
                  <Store size={12} />
                )}
                <span className="max-w-[120px] truncate">{m.store_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantCardWallet;
