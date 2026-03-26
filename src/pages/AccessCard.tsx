import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LogOut, Star, Calendar, Hash, User, CreditCard,
  ScanBarcode, Gift, Smartphone, Coffee, Sparkles,
  Clock, Tag, ArrowRight, Shield, Copy, Share2, Wallet
} from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.png";
import Barcode from "@/components/Barcode";
import ScrollReveal from "@/components/ScrollReveal";

interface CustomerData {
  id: string;
  full_name: string | null;
  crn: string | null;
  loyalty_card_number: string | null;
  card_issued_at: string | null;
  points_balance: number;
}

interface TransactionData {
  id: string;
  merchant_name: string;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
}

const STAMPS_TOTAL = 10;

const activeOffers = [
  {
    title: "Double Points Weekend",
    description: "Earn 2x points on all purchases this weekend at any partner store.",
    expiry: "2026-04-01",
    icon: Sparkles,
  },
  {
    title: "Free Coffee at 10 Stamps",
    description: "Complete your coffee stamp card and get a free coffee on us.",
    expiry: "2026-06-30",
    icon: Coffee,
  },
  {
    title: "20% Off Next Purchase",
    description: "Redeem 200 points for 20% off at selected merchants.",
    expiry: "2026-05-15",
    icon: Tag,
  },
];

const AccessCard = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsVisible, setPointsVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/get-started"); return; }

    const { data: customerData, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !customerData) { navigate("/get-started"); return; }
    if (!customerData.loyalty_card_number) { navigate("/customer/confirmation"); return; }

    setCustomer(customerData);

    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", customerData.id)
      .order("transaction_date", { ascending: false });

    setTransactions(txData || []);
    setLoading(false);
    setTimeout(() => setPointsVisible(true), 300);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/get-started");
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  const handleShare = async () => {
    if (!customer) return;
    const shareData = {
      title: "Perk Back Loyalty Card",
      text: `My Perk Back loyalty card: ${customer.loyalty_card_number}\nName: ${customer.full_name}\nCRN: ${customer.crn}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareData.text || "");
      toast.success("Card details copied to clipboard");
    }
  };

  const handleAddToWallet = (walletType: string) => {
    toast.info(`${walletType} integration coming soon! We're working on it.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
          <Star className="text-primary-foreground" size={24} />
        </div>
        <p className="text-muted-foreground text-sm">Loading your rewards...</p>
      </div>
    );
  }

  if (!customer) return null;

  const issuedDate = customer.card_issued_at
    ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  const coffeeStamps = transactions.length % STAMPS_TOTAL;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Gradient backdrop */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              Perk <span className="text-secondary">Back</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5 pb-20">

        {/* ─── Loyalty Card ─── */}
        <ScrollReveal>
          <div className="relative rounded-3xl overflow-hidden shadow-card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-foreground/5 to-transparent" />
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-primary-foreground/10" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full border border-primary-foreground/8" />

            <div className="relative z-10 p-5 sm:p-6 pb-4 sm:pb-5">
              {/* Card header */}
              <div className="flex items-start justify-between mb-4 sm:mb-5">
                <div>
                  <p className="text-primary-foreground/50 text-[10px] uppercase tracking-[0.2em] mb-0.5">Digital Loyalty Card</p>
                  <img src={perkbackLogo} alt="Perk Back" className="h-6 sm:h-7 w-auto brightness-0 invert" />
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/90 flex items-center justify-center shadow-lg">
                  <Star className="text-accent-foreground" size={16} />
                </div>
              </div>

              {/* Card details with copy buttons */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 mb-4 sm:mb-5">
                <div>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <User size={10} /> Name
                  </p>
                  <p className="text-primary-foreground font-semibold text-xs sm:text-sm truncate">{customer.full_name || "—"}</p>
                </div>
                <div className="group cursor-pointer" onClick={() => handleCopy("CRN", customer.crn || "")}>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Hash size={10} /> CRN
                    <Copy size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-primary-foreground font-semibold font-mono text-xs sm:text-sm">{customer.crn}</p>
                </div>
                <div className="group cursor-pointer" onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")}>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <CreditCard size={10} /> Card No.
                    <Copy size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-primary-foreground font-semibold font-mono text-[11px] sm:text-xs tracking-wide">{customer.loyalty_card_number}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={10} /> Issued
                  </p>
                  <p className="text-primary-foreground font-semibold text-xs sm:text-sm">{issuedDate}</p>
                </div>
              </div>

              {/* Barcode */}
              <div className="bg-primary-foreground rounded-2xl p-3 flex justify-center overflow-hidden">
                <Barcode value={customer.loyalty_card_number || ""} height={55} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Card Actions: Copy, Share, Add to Wallet ─── */}
        <ScrollReveal delay={50}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-10 border-border/50"
              onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")}
            >
              <Copy size={14} />
              <span className="hidden xs:inline">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-10 border-border/50"
              onClick={handleShare}
            >
              <Share2 size={14} />
              <span className="hidden xs:inline">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-10 border-border/50"
              onClick={() => handleAddToWallet("Wallet")}
            >
              <Wallet size={14} />
              <span className="hidden xs:inline">Wallet</span>
            </Button>
          </div>

          {/* Wallet options */}
          <div className="mt-3 bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
              <Wallet size={14} className="text-secondary" />
              Add to Digital Wallet
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { name: "Apple Wallet", emoji: "🍎" },
                { name: "Google Wallet", emoji: "📱" },
                { name: "Samsung Pay", emoji: "💳" },
              ].map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleAddToWallet(wallet.name)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 text-left"
                >
                  <span className="text-lg">{wallet.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{wallet.name}</span>
                  <ArrowRight size={14} className="text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Points Balance ─── */}
        <ScrollReveal delay={100}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mb-3">Points Balance</p>
            <div className={`flex items-center justify-center gap-3 transition-all duration-700 ${pointsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Star className="text-accent fill-accent" size={22} />
              </div>
              <span className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums">{customer.points_balance}</span>
            </div>
            <p className="text-muted-foreground text-xs mt-3">Keep earning to unlock exclusive rewards!</p>
          </div>
        </ScrollReveal>

        {/* ─── Coffee Stamps ─── */}
        <ScrollReveal delay={150}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Coffee size={16} className="text-accent" />
                Coffee Stamps
              </h3>
              <span className="text-xs text-muted-foreground font-medium">{coffeeStamps}/{STAMPS_TOTAL}</span>
            </div>
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5 mb-3">
              {Array.from({ length: STAMPS_TOTAL }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 ${
                    i < coffeeStamps
                      ? 'bg-accent/20 border-2 border-accent'
                      : 'bg-muted/60 border-2 border-transparent'
                  }`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  {i < coffeeStamps ? (
                    <Coffee size={10} className="text-accent-foreground" />
                  ) : (
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground/40">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full animate-progress"
                style={{ "--progress-width": `${(coffeeStamps / STAMPS_TOTAL) * 100}%` } as React.CSSProperties}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              {coffeeStamps === 0
                ? "Start collecting stamps for a free coffee!"
                : `${STAMPS_TOTAL - coffeeStamps} more ${STAMPS_TOTAL - coffeeStamps === 1 ? 'stamp' : 'stamps'} until your free coffee ☕`}
            </p>
          </div>
        </ScrollReveal>

        {/* ─── Points Earned (Transactions) ─── */}
        <ScrollReveal delay={200}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield size={16} className="text-secondary" />
              Points Earned
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 sm:py-10">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Gift size={24} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Visit a partner store to start earning!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 cursor-default"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{tx.merchant_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] sm:text-xs text-muted-foreground">${tx.purchase_amount.toFixed(2)}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(tx.transaction_date).toLocaleDateString("en-AU", {
                            day: "numeric", month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right pl-2 sm:pl-3">
                      <span className="text-sm sm:text-base font-bold text-accent-foreground bg-accent/15 px-2 sm:px-2.5 py-1 rounded-lg">
                        +{tx.points_awarded}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Active Offers ─── */}
        <ScrollReveal delay={250}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Active Offers
            </h3>
            <div className="space-y-3">
              {activeOffers.map((offer, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 cursor-default"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <offer.icon size={16} className="text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{offer.title}</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">{offer.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                      <Clock size={10} />
                      Expires {new Date(offer.expiry).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-secondary transition-colors mt-1 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Ways to Claim Points ─── */}
        <ScrollReveal delay={300}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Gift size={16} className="text-secondary" />
              Ways to Claim Points
            </h3>
            <div className="space-y-3">
              {[
                { icon: ScanBarcode, text: "Show your loyalty barcode or number at checkout" },
                { icon: Smartphone, text: "Merchant scans or enters your number" },
                { icon: Star, text: "Points are added instantly" },
                { icon: Gift, text: "Track your rewards anytime in Perk Back" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <item.icon size={14} className="text-secondary" />
                  </div>
                  <span className="text-xs sm:text-sm text-foreground/80">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Logout ─── */}
        <div className="pt-2 pb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
            className="w-full gap-2 text-muted-foreground border-border/50 hover:bg-muted/50"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessCard;
