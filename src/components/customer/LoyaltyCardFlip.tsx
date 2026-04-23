import { useMemo, useState } from "react";
import { Copy, Hash } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import Barcode from "@/components/Barcode";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { Button } from "@/components/ui/button";

interface LoyaltyCardFlipProps {
  fullName: string | null;
  crn: string | null;
  loyaltyCardNumber: string | null;
  issuedDate: string;
  pointsBalance: number;
  onCopy: (label: string, value: string) => void;
}

const LoyaltyCardFlip = ({
  fullName,
  crn,
  loyaltyCardNumber,
  issuedDate,
  pointsBalance,
  onCopy,
}: LoyaltyCardFlipProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const cardHolderName = useMemo(() => fullName || "PerkBack Member", [fullName]);
  const formattedCardNumber = useMemo(() => {
    if (!loyaltyCardNumber) return "—";
    return loyaltyCardNumber.replace(/(.{4})/g, "$1 ").trim();
  }, [loyaltyCardNumber]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsFlipped((current) => !current)}
        className="group block w-full [perspective:1800px]"
        aria-label="Flip loyalty card"
      >
        <div
          className="relative aspect-[1.58/1] w-full max-w-[380px] mx-auto transition-transform duration-700 ease-out"
          style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-[26px] border border-primary-foreground/15 bg-gradient-to-br from-primary via-secondary to-accent p-5 text-primary-foreground shadow-hero"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--background)/0.16),transparent_34%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--background)/0.04),transparent_48%,hsl(var(--background)/0.12))]" />
            <div className="absolute right-[-1.75rem] top-6 h-36 w-36 rounded-full border border-primary-foreground/18" />
            <div className="absolute right-6 top-10 h-24 w-24 rounded-full border border-primary-foreground/12" />
            <div className="absolute left-5 top-[4.6rem] h-11 w-16 rounded-2xl border border-primary-foreground/28 bg-background/18 backdrop-blur-sm" />

            <div className="relative z-10 flex h-full flex-col justify-between text-left">
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/72">Digital loyalty</p>
                  <img src={perkbackLogo} alt="PerkBack" className="h-7 w-auto brightness-0 invert" />
              </div>

                <div className="space-y-5 pt-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">Points balance</p>
                    <p className="mt-2 text-[2rem] font-bold leading-none">{pointsBalance.toLocaleString("en-AU")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">Member</p>
                    <p className="mt-2 text-[1.2rem] font-bold leading-none text-primary-foreground">{cardHolderName}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <p className="text-[10px] text-primary-foreground/74">Tap card to see QR + barcode</p>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">Card number</p>
                  <p className="mt-1 font-mono text-[0.95rem] font-semibold tracking-[0.04em] text-primary-foreground">{formattedCardNumber}</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 overflow-hidden rounded-[26px] border border-border/40 bg-card p-5 shadow-card"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex h-full flex-col justify-between text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Scan at checkout</p>
                  <p className="mt-1 text-sm font-medium text-foreground">Use your QR or barcode at participating stores.</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">CRN</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-foreground">{crn || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 items-center">
                <div className="flex h-[104px] w-[104px] items-center justify-center rounded-[20px] border border-border/50 bg-background text-foreground shadow-sm">
                  <QRCodeDisplay value={loyaltyCardNumber || ""} size={84} className="flex h-[84px] w-[84px] items-center justify-center" />
                </div>
                <div className="flex min-h-[104px] items-center justify-center rounded-[20px] border border-border/50 bg-background px-3 py-2 text-foreground shadow-sm">
                  <Barcode value={loyaltyCardNumber || ""} height={56} className="h-[90px] w-[188px]" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span>Issued {issuedDate}</span>
                <span>Tap card to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </button>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-10 flex-1 gap-2" onClick={() => onCopy("CRN", crn || "") }>
          <Hash size={14} /> Copy CRN
        </Button>
        <Button variant="outline" size="sm" className="h-10 flex-1 gap-2" onClick={() => onCopy("Card Number", loyaltyCardNumber || "") }>
          <Copy size={14} /> Copy Card
        </Button>
      </div>
    </div>
  );
};

export default LoyaltyCardFlip;