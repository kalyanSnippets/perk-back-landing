import { useMemo, useState } from "react";
import { Calendar, Copy, CreditCard, Hash, Sparkles, User } from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import Barcode from "@/components/Barcode";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { Button } from "@/components/ui/button";

interface LoyaltyCardFlipProps {
  fullName: string | null;
  crn: string | null;
  loyaltyCardNumber: string | null;
  issuedDate: string;
  onCopy: (label: string, value: string) => void;
}

const LoyaltyCardFlip = ({
  fullName,
  crn,
  loyaltyCardNumber,
  issuedDate,
  onCopy,
}: LoyaltyCardFlipProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const cardHolderName = useMemo(() => fullName || "PerkBack Member", [fullName]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsFlipped((current) => !current)}
        className="group block w-full [perspective:1800px]"
        aria-label="Flip loyalty card"
      >
        <div
          className="relative h-[240px] w-full transition-transform duration-700 ease-out"
          style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-[30px] border border-border/20 bg-gradient-to-br from-primary via-secondary to-accent p-5 text-primary-foreground shadow-card-hover"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--background)/0.18),transparent_38%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--background)/0.04),transparent_42%,hsl(var(--background)/0.14))]" />
            <div className="absolute -right-8 top-6 h-32 w-32 rounded-full border border-primary-foreground/15" />
            <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full border border-primary-foreground/10" />
            <div className="absolute inset-x-6 top-6 h-px bg-primary-foreground/25" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/70">PerkBack loyalty</p>
                  <img src={perkbackLogo} alt="PerkBack" className="mt-1 h-7 w-auto brightness-0 invert" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/15 backdrop-blur-sm">
                  <CreditCard size={18} className="text-primary-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-14 rounded-xl bg-background/80 shadow-inner" />
                <div className="h-8 w-10 rounded-lg border border-primary-foreground/25 bg-background/20 backdrop-blur-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="col-span-2">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-primary-foreground/70">
                    <User size={10} /> Member
                  </p>
                  <p className="mt-1 text-[1.15rem] font-bold leading-none">{cardHolderName}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-primary-foreground/70">
                    <Hash size={10} /> CRN
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold">{crn || "—"}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-primary-foreground/70">
                    <Calendar size={10} /> Issued
                  </p>
                  <p className="mt-1 text-sm font-semibold">{issuedDate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/70">Card number</p>
                  <p className="mt-1 font-mono text-base font-semibold tracking-[0.08em]">{loyaltyCardNumber || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 overflow-hidden rounded-[30px] border border-border/30 bg-card p-5 shadow-card-hover"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Use at checkout</p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">Scan your loyalty ID</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10">
                  <Sparkles size={16} className="text-secondary" />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Present this code or barcode to earn points in store.</p>
                <div className="rounded-[22px] border border-border/40 bg-background p-3 shadow-sm">
                  <Barcode value={loyaltyCardNumber || ""} height={58} className="block h-[102px] w-full" />
                </div>
                <div className="flex justify-center rounded-[22px] border border-border/40 bg-background p-3 shadow-sm">
                  <QRCodeDisplay value={loyaltyCardNumber || ""} size={88} className="flex items-center justify-center" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{issuedDate}</span>
                <span className="font-medium text-foreground">{cardHolderName}</span>
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