import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Star, Calendar, Hash, User, CreditCard,
  ScanBarcode, Gift, Smartphone, Coffee, Sparkles,
  Clock, Tag, ArrowRight, Shield, Copy, Share2, Wallet,
  Megaphone, CalendarDays, Flame, ChevronLeft, ChevronRight
} from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.png";
import Barcode from "@/components/Barcode";
import ScrollReveal from "@/components/ScrollReveal";
import StarRating from "@/components/StarRating";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

/* ── Write a Review Section ── */
const WriteReviewSection = ({ customerName }: { customerName: string }) => {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error("Please write a review"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("testimonials").insert({
      name: customerName || "Anonymous",
      message: message.trim(),
      rating,
      is_published: false,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thank you! Your testimonial will be reviewed.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50 text-center">
        <MessageSquare size={24} className="mx-auto text-accent mb-2" />
        <p className="text-sm font-semibold text-foreground">Review Submitted!</p>
        <p className="text-xs text-muted-foreground mt-1">It will appear on the site once approved.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare size={16} className="text-secondary" />
        Write a Review
      </h3>
      <div className="space-y-3">
        <StarRating rating={rating} onChange={setRating} />
        <textarea
          placeholder="Tell us about your experience..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none"
          maxLength={500}
        />
        <Button onClick={handleSubmit} disabled={submitting} size="sm" className="gap-2">
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
};

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
  merchant_id: string | null;
  purchase_amount: number;
  points_awarded: number;
  transaction_date: string;
}

interface RewardData {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  is_limited_time: boolean;
  expires_at: string | null;
  merchant_id: string;
  store_name?: string;
}

interface CampaignData {
  id: string;
  title: string;
  description: string | null;
  ai_generated: boolean | null;
  image_url: string | null;
  target_segment: string | null;
  merchant_id: string;
  store_name?: string;
}

interface MonthlyOfferData {
  id: string;
  title: string;
  description: string | null;
  valid_from: string | null;
  valid_to: string | null;
  merchant_id: string;
  store_name?: string;
}

const STAMPS_TOTAL = 10;

const CAROUSEL_GRADIENTS = [
  "from-primary via-primary/90 to-secondary",
  "from-secondary via-secondary/90 to-primary",
  "from-accent/90 via-accent/80 to-primary/80",
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const daysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const rewardTypeIcon = (type: string) => {
  switch (type) {
    case "freebie": return Coffee;
    case "voucher": return Tag;
    case "discount": return Sparkles;
    default: return Gift;
  }
};

const AccessCard = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOfferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsVisible, setPointsVisible] = useState(false);
  const { isAdmin, user } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);

  // Auto-play carousel
  useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => setCurrentSlide(carouselApi.selectedScrollSnap()));
    const interval = setInterval(() => carouselApi.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [carouselApi]);

  useEffect(() => { fetchData(); }, []);

  // Realtime subscription
  useEffect(() => {
    if (!customer) return;
    const channel = supabase
      .channel('customer-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new.customer_id === customer.id) fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, (payload) => {
        if (payload.new.id === customer.id) {
          setCustomer((prev) => prev ? { ...prev, points_balance: (payload.new as any).points_balance } : prev);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => fetchOffersData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => fetchOffersData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_offers' }, () => fetchOffersData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer?.id]);

  const fetchOffersData = useCallback(async () => {
    if (!customer) return;

    // Get ALL merchant names
    const { data: merchantsData } = await supabase.from("merchants").select("id, store_name");
    const merchantMap = new Map((merchantsData || []).map(m => [m.id, m.store_name]));

    const [rewardsRes, campaignsRes, offersRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
    ]);

    setRewards((rewardsRes.data || []).map(r => ({ ...r, store_name: merchantMap.get(r.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map(c => ({ ...c, store_name: merchantMap.get(c.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map(o => ({ ...o, store_name: merchantMap.get(o.merchant_id) || "Store" })));
  }, [customer]);

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { navigate("/get-started"); return; }

    const { data: customerData, error } = await supabase
      .from("customers").select("*").eq("user_id", authUser.id).maybeSingle();
    if (error || !customerData) { navigate("/get-started"); return; }
    if (!customerData.loyalty_card_number) { navigate("/customer/confirmation"); return; }
    setCustomer(customerData);

    const { data: txData } = await supabase
      .from("transactions").select("*").eq("customer_id", customerData.id)
      .order("transaction_date", { ascending: false });
    const txs = txData || [];
    setTransactions(txs);

    // Fetch all active offers from all merchants
    const { data: merchantsData } = await supabase.from("merchants").select("id, store_name");
    const merchantMap = new Map((merchantsData || []).map(m => [m.id, m.store_name]));

    const [rewardsRes, campaignsRes, offersRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
    ]);

    setRewards((rewardsRes.data || []).map(r => ({ ...r, store_name: merchantMap.get(r.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map(c => ({ ...c, store_name: merchantMap.get(c.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map(o => ({ ...o, store_name: merchantMap.get(o.merchant_id) || "Store" })));

    setLoading(false);
    setTimeout(() => setPointsVisible(true), 300);
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied to clipboard`)).catch(() => toast.error("Failed to copy"));
  };

  const handleShare = async () => {
    if (!customer) return;
    const shareData = {
      title: "Perk Back Loyalty Card",
      text: `My Perk Back loyalty card: ${customer.loyalty_card_number}\nName: ${customer.full_name}\nCRN: ${customer.crn}`,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
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
    ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const coffeeStamps = transactions.length % STAMPS_TOTAL;

  // Build carousel slides from campaigns + monthly offers
  const carouselSlides = [
    ...campaigns.map(c => ({ type: "campaign" as const, title: c.title, description: c.description, store: c.store_name, endsIn: null })),
    ...monthlyOffers.map(o => ({ type: "offer" as const, title: o.title, description: o.description, store: o.store_name, endsIn: o.valid_to ? daysUntil(o.valid_to) : null })),
  ];

  // Nearest reachable reward
  const nearestReward = rewards.length > 0
    ? rewards.reduce((closest, r) => {
        const diff = r.points_required - customer.points_balance;
        const closestDiff = closest.points_required - customer.points_balance;
        if (diff > 0 && (closestDiff <= 0 || diff < closestDiff)) return r;
        return closest;
      }, rewards[0])
    : null;

  const nearestProgress = nearestReward ? Math.min((customer.points_balance / nearestReward.points_required) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      {/* Gradient backdrop */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5 pb-20 pt-20 sm:pt-24">

        {/* ─── Greeting ─── */}
        <ScrollReveal>
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {getGreeting()}, {customer.full_name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </ScrollReveal>

        {/* ─── Loyalty Card ─── */}
        <ScrollReveal>
          <div className="relative rounded-3xl overflow-hidden shadow-card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-foreground/5 to-transparent" />
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-primary-foreground/10" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full border border-primary-foreground/8" />

            <div className="relative z-10 p-5 sm:p-6 pb-4 sm:pb-5">
              <div className="flex items-start justify-between mb-4 sm:mb-5">
                <div>
                  <p className="text-primary-foreground/50 text-[10px] uppercase tracking-[0.2em] mb-0.5">Digital Loyalty Card</p>
                  <img src={perkbackLogo} alt="Perk Back" className="h-6 sm:h-7 w-auto brightness-0 invert" />
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/90 flex items-center justify-center shadow-lg">
                  <Star className="text-accent-foreground" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 mb-4 sm:mb-5">
                <div>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><User size={10} /> Name</p>
                  <p className="text-primary-foreground font-semibold text-xs sm:text-sm truncate">{customer.full_name || "—"}</p>
                </div>
                <div className="group cursor-pointer" onClick={() => handleCopy("CRN", customer.crn || "")}>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><Hash size={10} /> CRN <Copy size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                  <p className="text-primary-foreground font-semibold font-mono text-xs sm:text-sm">{customer.crn}</p>
                </div>
                <div className="group cursor-pointer" onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")}>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><CreditCard size={10} /> Card No. <Copy size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                  <p className="text-primary-foreground font-semibold font-mono text-[11px] sm:text-xs tracking-wide">{customer.loyalty_card_number}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider flex items-center gap-1"><Calendar size={10} /> Issued</p>
                  <p className="text-primary-foreground font-semibold text-xs sm:text-sm">{issuedDate}</p>
                </div>
              </div>

              <div className="bg-primary-foreground rounded-2xl p-3 flex justify-center overflow-hidden">
                <Barcode value={customer.loyalty_card_number || ""} height={55} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Card Actions ─── */}
        <ScrollReveal delay={50}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-10 border-border/50" onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")}>
              <Copy size={14} /><span className="hidden xs:inline">Copy</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-10 border-border/50" onClick={handleShare}>
              <Share2 size={14} /><span className="hidden xs:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-10 border-border/50" onClick={() => handleAddToWallet("Wallet")}>
              <Wallet size={14} /><span className="hidden xs:inline">Wallet</span>
            </Button>
          </div>

          <div className="mt-3 bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2"><Wallet size={14} className="text-secondary" />Add to Digital Wallet</h3>
            <div className="grid grid-cols-1 gap-2">
              {[{ name: "Apple Wallet", emoji: "🍎" }, { name: "Google Wallet", emoji: "📱" }, { name: "Samsung Pay", emoji: "💳" }].map((wallet) => (
                <button key={wallet.name} onClick={() => handleAddToWallet(wallet.name)} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 text-left">
                  <span className="text-lg">{wallet.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{wallet.name}</span>
                  <ArrowRight size={14} className="text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Points Balance with Next Reward Progress ─── */}
        <ScrollReveal delay={100}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mb-3">Points Balance</p>
            <div className={`flex items-center justify-center gap-3 transition-all duration-700 ${pointsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Star className="text-accent fill-accent" size={22} />
              </div>
              <span className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums">{customer.points_balance}</span>
            </div>
            {nearestReward && nearestReward.points_required > customer.points_balance ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Next: <span className="font-semibold text-foreground">{nearestReward.title}</span></span>
                  <span>{nearestReward.points_required - customer.points_balance} pts to go</span>
                </div>
                <Progress value={nearestProgress} className="h-2" />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs mt-3">Keep earning to unlock exclusive rewards!</p>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Promo Banner Carousel ─── */}
        {carouselSlides.length > 0 && (
          <ScrollReveal delay={125}>
            <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {carouselSlides.map((slide, i) => (
                  <CarouselItem key={`${slide.type}-${i}`}>
                    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${CAROUSEL_GRADIENTS[i % CAROUSEL_GRADIENTS.length]} p-5 sm:p-6 min-h-[140px] flex flex-col justify-between`}>
                      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-primary-foreground/10" />
                      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border border-primary-foreground/8" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          {slide.type === "campaign" ? (
                            <Megaphone size={14} className="text-primary-foreground/70" />
                          ) : (
                            <CalendarDays size={14} className="text-primary-foreground/70" />
                          )}
                          <span className="text-primary-foreground/60 text-[10px] uppercase tracking-wider">{slide.store}</span>
                        </div>
                        <h3 className="text-primary-foreground font-bold text-base sm:text-lg leading-tight">{slide.title}</h3>
                        {slide.description && (
                          <p className="text-primary-foreground/70 text-xs mt-1 line-clamp-2">{slide.description}</p>
                        )}
                      </div>
                      <div className="relative z-10 flex items-center justify-between mt-3">
                        <span className="text-[10px] uppercase tracking-wider text-primary-foreground/50">
                          {slide.type === "campaign" ? "Campaign" : "Monthly Offer"}
                        </span>
                        {slide.endsIn !== null && (
                          <span className="text-[10px] bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={9} /> Ends in {slide.endsIn} days
                          </span>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Dot indicators */}
              {slideCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => carouselApi?.scrollTo(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-primary w-5' : 'bg-border'}`}
                    />
                  ))}
                </div>
              )}
            </Carousel>
          </ScrollReveal>
        )}

        {/* ─── Available Rewards ─── */}
        <ScrollReveal delay={150}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Gift size={16} className="text-accent" />
              Available Rewards
            </h3>
            {rewards.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Gift size={22} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No rewards available yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Shop at partner stores to unlock rewards.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                {rewards.map((r) => {
                  const progress = Math.min((customer.points_balance / r.points_required) * 100, 100);
                  const almostThere = progress >= 80 && progress < 100;
                  const readyToRedeem = progress >= 100;
                  const IconComp = rewardTypeIcon(r.reward_type);

                  return (
                    <div
                      key={r.id}
                      className={`min-w-[200px] sm:min-w-[220px] snap-start flex-shrink-0 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${
                        readyToRedeem
                          ? 'border-accent/50 bg-accent/5 shadow-[0_0_20px_-4px_hsl(var(--accent)/0.3)]'
                          : 'border-border/30 bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${readyToRedeem ? 'bg-accent/20' : 'bg-secondary/10'}`}>
                          <IconComp size={14} className={readyToRedeem ? 'text-accent-foreground' : 'text-secondary'} />
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize bg-muted/40 px-1.5 py-0.5 rounded">{r.reward_type}</span>
                      </div>
                      <p className="font-semibold text-xs text-foreground mb-0.5">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground/70 mb-0.5">{r.store_name}</p>
                      {r.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{r.description}</p>}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>{customer.points_balance}/{r.points_required} pts</span>
                        {readyToRedeem && <span className="text-accent-foreground font-bold animate-pulse">Ready to redeem!</span>}
                        {almostThere && <span className="text-secondary font-semibold">Almost there!</span>}
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      {r.is_limited_time && r.expires_at && (
                        <p className="text-[9px] text-muted-foreground/60 mt-2 flex items-center gap-0.5">
                          <Clock size={8} /> Expires {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Active Campaigns ─── */}
        <ScrollReveal delay={200}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Megaphone size={16} className="text-secondary" />
              Active Campaigns
            </h3>
            {campaigns.length === 0 ? (
              <div className="text-center py-6">
                <Megaphone size={22} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No active campaigns right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 cursor-default overflow-hidden relative">
                    {/* Accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary to-primary rounded-l-xl" />
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5 ml-2">
                      <Megaphone size={16} className="text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs sm:text-sm text-foreground">{c.title}</p>
                        {c.ai_generated && (
                          <span className="text-[9px] bg-accent/15 text-accent-foreground px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Sparkles size={8} /> AI
                          </span>
                        )}
                      </div>
                      {c.description && <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{c.store_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Monthly Offers ─── */}
        <ScrollReveal delay={225}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-accent" />
              Monthly Offers
            </h3>
            {monthlyOffers.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays size={22} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No monthly offers right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyOffers.map((o) => (
                  <div key={o.id} className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 cursor-default">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarDays size={16} className="text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">{o.title}</p>
                      {o.description && <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{o.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/60">{o.store_name}</span>
                        {o.valid_to && (
                          <span className="text-[10px] bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Clock size={8} /> Ends in {daysUntil(o.valid_to)} days
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Points Earned (Transactions) ─── */}
        <ScrollReveal delay={250}>
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
                  <div key={tx.id} className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 cursor-default">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{tx.merchant_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] sm:text-xs text-muted-foreground">${tx.purchase_amount.toFixed(2)}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(tx.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right pl-2 sm:pl-3">
                      <span className="text-sm sm:text-base font-bold text-accent-foreground bg-accent/15 px-2 sm:px-2.5 py-1 rounded-lg">+{tx.points_awarded}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Write a Review ─── */}
        <ScrollReveal delay={275}>
          <WriteReviewSection customerName={customer?.full_name || ""} />
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

        {/* ─── Admin Panel ─── */}
        {isAdmin && (
          <ScrollReveal>
            <Link to="/admin" className="block">
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-5 sm:p-6 border border-accent/20 flex items-center justify-between hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Shield size={20} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Admin Panel</p>
                    <p className="text-xs text-muted-foreground">Manage blogs, testimonials & messages</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-accent" />
              </div>
            </Link>
          </ScrollReveal>
        )}

      </div>
    </div>
  );
};

export default AccessCard;
