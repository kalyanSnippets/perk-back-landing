import { useMemo, useState } from "react";
import Barcode from "@/components/Barcode";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import perkbackLogo from "@/assets/perkback-logo.webp";
import { Store } from "lucide-react";

export interface MerchantCardDesign {
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background_image_url: string | null;
  card_style: "gradient" | "solid" | "image";
  show_logo: boolean;
  show_points: boolean;
  barcode_format: "code128" | "qr" | "both";
}

export const DEFAULT_CARD_DESIGN: MerchantCardDesign = {
  primary_color: "#0a1f5c",
  secondary_color: "#4d8fd6",
  text_color: "#ffffff",
  background_image_url: null,
  card_style: "gradient",
  show_logo: true,
  show_points: true,
  barcode_format: "both",
};

interface Props {
  storeName: string;
  storeLogoUrl?: string | null;
  fullName: string | null;
  loyaltyCardNumber: string | null;
  pointsBalance: number;
  design?: MerchantCardDesign | null;
  compact?: boolean;
}

const MerchantLoyaltyCard = ({
  storeName,
  storeLogoUrl,
  fullName,
  loyaltyCardNumber,
  pointsBalance,
  design,
  compact = false,
}: Props) => {
  const [flipped, setFlipped] = useState(false);
  const d = design ?? DEFAULT_CARD_DESIGN;

  const formattedCardNumber = useMemo(() => {
    if (!loyaltyCardNumber) return "—";
    return loyaltyCardNumber.replace(/(.{4})/g, "$1 ").trim();
  }, [loyaltyCardNumber]);

  const background =
    d.card_style === "image" && d.background_image_url
      ? `url(${d.background_image_url}) center/cover no-repeat, ${d.primary_color}`
      : d.card_style === "solid"
        ? d.primary_color
        : `linear-gradient(135deg, ${d.primary_color}, ${d.secondary_color})`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setFlipped((c) => !c)}
        className="block w-full"
        aria-label={`Flip ${storeName} loyalty card`}
      >
        <div className="relative mx-auto aspect-[1.64/1] w-full max-w-[392px]">
          {/* Front */}
          <div
            className={`absolute inset-0 overflow-hidden rounded-[22px] border border-white/15 p-5 shadow-hero transition-all duration-300 ease-out ${
              flipped ? "pointer-events-none opacity-0 scale-[0.985]" : "opacity-100 scale-100"
            }`}
            style={{ background, color: d.text_color }}
            aria-hidden={flipped}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%)]" />
            <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto] text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {d.show_logo && storeLogoUrl ? (
                    <img src={storeLogoUrl} alt={storeName} className="h-8 w-8 rounded-lg bg-white/90 object-contain p-1" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                      <Store size={16} />
                    </div>
                  )}
                  <p className="truncate text-sm font-bold" style={{ color: d.text_color }}>{storeName}</p>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">Loyalty</p>
              </div>

              <div className="flex min-h-0 flex-col justify-center gap-3 py-2">
                {d.show_points && (
                  <div>
                    <p className="tabular-nums text-[2rem] font-bold leading-none">
                      {pointsBalance.toLocaleString("en-AU")}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">Points</p>
                  </div>
                )}
                <div className="max-w-[80%]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">Member</p>
                  <p className="text-base font-bold leading-tight truncate">{fullName || "Member"}</p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3">
                <p className="text-[9px] opacity-60">Tap to view code</p>
                <p className="font-mono text-[0.8rem] font-semibold tracking-[0.05em]">{formattedCardNumber}</p>
              </div>
            </div>
          </div>

          {/* Back */}
          <div
            className={`absolute inset-0 overflow-hidden rounded-[22px] border border-border/50 bg-card p-4 text-card-foreground shadow-card transition-all duration-300 ease-out ${
              flipped ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[0.985]"
            }`}
            aria-hidden={!flipped}
          >
            <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-2 text-left">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Scan at {storeName}</p>
                <p className="font-mono text-xs font-semibold">{loyaltyCardNumber || "—"}</p>
              </div>

              <div className={`grid min-h-[100px] items-center gap-3 ${d.barcode_format === "qr" ? "grid-cols-1" : d.barcode_format === "code128" ? "grid-cols-1" : "grid-cols-[88px_minmax(0,1fr)]"}`}>
                {(d.barcode_format === "qr" || d.barcode_format === "both") && (
                  <QRCodeDisplay value={loyaltyCardNumber || ""} size={d.barcode_format === "qr" ? 110 : 78} className="justify-self-center" />
                )}
                {(d.barcode_format === "code128" || d.barcode_format === "both") && (
                  <div className="flex h-full min-h-[90px] items-center justify-center overflow-hidden rounded-[16px] border border-border/50 bg-background px-3 py-2">
                    <Barcode value={loyaltyCardNumber || ""} width={1.3} height={48} className="text-foreground" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <img src={perkbackLogo} alt="PerkBack" className="h-3 w-auto opacity-60" />
                <span>Tap to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default MerchantLoyaltyCard;
