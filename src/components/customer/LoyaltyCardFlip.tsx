import { useMemo, useState } from "react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import Barcode from "@/components/Barcode";
import QRCodeDisplay from "@/components/QRCodeDisplay";

interface LoyaltyCardFlipProps {
  fullName: string | null;
  crn: string | null;
  loyaltyCardNumber: string | null;
  issuedDate: string;
  pointsBalance: number;
}

const LoyaltyCardFlip = ({
  fullName,
  crn,
  loyaltyCardNumber,
  issuedDate,
  pointsBalance,
}: LoyaltyCardFlipProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasScanCode = Boolean(loyaltyCardNumber);

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
        className="group block w-full"
        aria-label="Flip loyalty card"
      >
        <div
          className="relative mx-auto aspect-[1.64/1] w-full max-w-[392px] isolate"
        >
          <div
            className={`absolute inset-0 overflow-hidden rounded-[22px] border border-primary-foreground/12 bg-gradient-to-br from-primary via-secondary to-primary-glow p-5 text-primary-foreground shadow-hero transition-all duration-300 ease-out ${
              isFlipped ? "pointer-events-none opacity-0 scale-[0.985]" : "opacity-100 scale-100"
            }`}
            aria-hidden={isFlipped}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--background)/0.14),transparent_28%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--background)/0.05),transparent_42%,hsl(var(--background)/0.1))]" />
            <div className="absolute -right-10 -top-7 h-36 w-36 rounded-full border border-primary-foreground/14" />
            <div className="absolute right-7 top-6 h-20 w-20 rounded-full border border-primary-foreground/10" />

            <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto] text-left">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/72">Digital loyalty</p>
                <img src={perkbackLogo} alt="PerkBack" className="mx-auto h-6 w-auto translate-x-5 brightness-0 invert" />
              </div>

              <div className="flex min-h-0 flex-col justify-center gap-4 py-3">
                <div className="space-y-1">
                  <p className="tabular-nums text-[2.15rem] font-bold leading-none text-primary-foreground">
                    {pointsBalance.toLocaleString("en-AU")}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/68">Points balance</p>
                </div>

                <div className="max-w-[76%] space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/68">Member</p>
                  <p
                    className="text-[1.15rem] font-bold leading-[1.12] text-primary-foreground"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    }}
                  >
                    {cardHolderName}
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <p className="text-[10px] text-primary-foreground/72">Tap card to see QR + barcode</p>
                <div className="max-w-[48%] text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/68">Card number</p>
                  <p className="mt-1 font-mono text-[0.9rem] font-semibold tracking-[0.05em] text-primary-foreground">
                    {formattedCardNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`absolute inset-0 overflow-hidden rounded-[22px] border border-border/50 bg-card p-5 text-card-foreground shadow-card transition-all duration-300 ease-out ${
              isFlipped ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[0.985]"
            }`}
            aria-hidden={!isFlipped}
          >
            <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Scan at checkout</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">CRN</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-foreground">{crn || "—"}</p>
                </div>
              </div>

              <div className="grid min-h-[116px] grid-cols-[98px_minmax(0,1fr)] items-center gap-3">
                <QRCodeDisplay
                  value={loyaltyCardNumber || ""}
                  size={78}
                  className="self-center justify-self-start"
                />
                <div className="flex min-h-[106px] items-center justify-center overflow-hidden rounded-[18px] border border-border/50 bg-background px-3 py-3 shadow-sm">
                  <Barcode value={loyaltyCardNumber || ""} width={1.34} height={50} className="text-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                {!hasScanCode && (
                  <p className="text-[11px] text-muted-foreground">Your loyalty card is still loading. Please try again in a moment.</p>
                )}
                <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <span>Issued {issuedDate}</span>
                  <span>Tap card to flip back</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>

    </div>
  );
};

export default LoyaltyCardFlip;
