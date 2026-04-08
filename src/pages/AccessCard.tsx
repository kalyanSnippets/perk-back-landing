import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Star, Calendar, Hash, User, CreditCard,
  ScanBarcode, Gift, Smartphone, Coffee, Sparkles,
  Clock, Tag, ArrowRight, Shield, Copy, Share2,
  Megaphone, CalendarDays, ChevronRight,
  CheckCircle, XCircle, Ticket, Info, Store, ArrowLeft
} from "lucide-react";
import perkbackLogo from "@/assets/perkback-logo.webp";
import Barcode from "@/components/Barcode";
import ScrollReveal from "@/components/ScrollReveal";
import ExploreTab from "@/components/customer/ExploreTab";
import StampCardProgress from "@/components/customer/StampCardProgress";
import NfcTapButton from "@/components/customer/NfcTapButton";
import StarRating from "@/components/StarRating";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

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
      name: customerName || "Anonymous", message: message.trim(), rating, is_published: false,
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
        <MessageSquare size={16} className="text-secondary" /> Write a Review
      </h3>
      <div className="space-y-3">
        <StarRating rating={rating} onChange={setRating} />
        <textarea placeholder="Tell us about your experience..." value={message} onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none" maxLength={500} />
        <Button onClick={handleSubmit} disabled={submitting} size="sm" className="gap-2">
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
};

interface CustomerData { id: string; full_name: string | null; crn: string | null; loyalty_card_number: string | null; card_issued_at: string | null; points_balance: number; }
interface CustomerMerchantData { merchant_id: string; store_name: string; points_balance: number; total_spend: number; visit_count: number; last_visit_at: string | null; logo_url?: string | null; }
interface TransactionData { id: string; merchant_name: string; merchant_id: string | null; purchase_amount: number; points_awarded: number; transaction_date: string; }
interface RewardData { id: string; title: string; description: string | null; points_required: number; reward_type: string; is_limited_time: boolean; expires_at: string | null; merchant_id: string; store_name?: string; image_url?: string | null; }
interface CampaignData { id: string; title: string; description: string | null; ai_generated: boolean | null; image_url: string | null; target_segment: string | null; merchant_id: string; store_name?: string; }
interface MonthlyOfferData { id: string; title: string; description: string | null; valid_from: string | null; valid_to: string | null; merchant_id: string; store_name?: string; }
interface RedemptionData { id: string; reward_title: string; points_spent: number; redemption_code: string; status: string; expires_at: string; created_at: string; merchant_id: string; store_name?: string; }

const CAROUSEL_GRADIENTS = [
  "from-primary via-primary/90 to-secondary",
  "from-secondary via-secondary/90 to-primary",
  "from-accent/90 via-accent/80 to-primary/80",
];

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; };
const daysUntil = (dateStr: string) => { const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)); return diff > 0 ? diff : 0; };
const rewardTypeIcon = (type: string) => { switch (type) { case "freebie": return Coffee; case "voucher": return Tag; case "discount": return Sparkles; default: return Gift; } };

const AccessCard = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [customerMerchants, setCustomerMerchants] = useState<CustomerMerchantData[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOfferData[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsVisible, setPointsVisible] = useState(false);
  const { isAdmin } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState<{ code: string; title: string; points: number; expires: string } | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardData | null>(null);
  const [showClaimInfo, setShowClaimInfo] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"my-rewards" | "explore">("my-rewards");

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
        if (payload.new.id === customer.id) setCustomer((prev) => prev ? { ...prev, points_balance: (payload.new as any).points_balance } : prev);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => fetchOffersData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => fetchOffersData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_offers' }, () => fetchOffersData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer?.id]);

  const fetchOffersData = useCallback(async () => {
    if (!customer) return;
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
    const { data: customerData, error } = await supabase.from("customers").select("*").eq("user_id", authUser.id).maybeSingle();
    if (error || !customerData) { navigate("/get-started"); return; }
    if (!customerData.loyalty_card_number) { navigate("/customer/confirmation"); return; }
    setCustomer(customerData);

    // Fetch customer-merchant relationships
    const { data: cmData } = await supabase
      .from("customer_merchants")
      .select("merchant_id, points_balance, total_spend, visit_count, last_visit_at")
      .eq("customer_id", customerData.id);

    const { data: txData } = await supabase.from("transactions").select("*").eq("customer_id", customerData.id).order("transaction_date", { ascending: false });
    setTransactions(txData || []);
    const { data: merchantsData } = await supabase.from("merchants").select("id, store_name, logo_url");
    const merchantMap = new Map((merchantsData || []).map(m => [m.id, m.store_name]));
    const merchantLogoMap = new Map((merchantsData || []).map(m => [m.id, m.logo_url]));

    // Build customer merchants list
    const cmList: CustomerMerchantData[] = (cmData || []).map(cm => ({
      merchant_id: cm.merchant_id,
      store_name: merchantMap.get(cm.merchant_id) || "Store",
      points_balance: cm.points_balance,
      total_spend: Number(cm.total_spend),
      visit_count: cm.visit_count,
      last_visit_at: cm.last_visit_at,
      logo_url: merchantLogoMap.get(cm.merchant_id),
    }));
    setCustomerMerchants(cmList);

    const [rewardsRes, campaignsRes, offersRes, redemptionsRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true),
      supabase.from("campaigns").select("*").eq("active", true),
      supabase.from("monthly_offers").select("*").eq("active", true),
      supabase.from("redemptions").select("*").eq("customer_id", customerData.id).order("created_at", { ascending: false }),
    ]);
    setRewards((rewardsRes.data || []).map(r => ({ ...r, store_name: merchantMap.get(r.merchant_id) || "Store" })));
    setCampaigns((campaignsRes.data || []).map(c => ({ ...c, store_name: merchantMap.get(c.merchant_id) || "Store" })));
    setMonthlyOffers((offersRes.data || []).map(o => ({ ...o, store_name: merchantMap.get(o.merchant_id) || "Store" })));
    setRedemptions((redemptionsRes.data || []).map((r: any) => ({ ...r, store_name: merchantMap.get(r.merchant_id) || "Store" })));
    setLoading(false);
    setTimeout(() => setPointsVisible(true), 300);
  };

  const handleRedeem = async (rewardId: string) => {
    if (!customer) return;
    setRedeeming(rewardId);
    try {
      const { data, error } = await supabase.rpc("redeem_reward", { _customer_id: customer.id, _reward_id: rewardId });
      if (error) throw error;
      const result = data as any;
      if (!result.success) { toast.error(result.error || "Redemption failed"); return; }
      setSelectedReward(null);
      setShowRedemptionModal({ code: result.redemption_code, title: result.reward_title, points: result.points_spent, expires: result.expires_at });
      await fetchData();
    } catch (err: any) { toast.error(err.message || "Redemption failed"); }
    finally { setRedeeming(null); }
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied to clipboard`)).catch(() => toast.error("Failed to copy"));
  };

  const handleShare = async () => {
    if (!customer) return;
    const shareData = { title: "Perk Back Loyalty Card", text: `My Perk Back loyalty card: ${customer.loyalty_card_number}\nName: ${customer.full_name}\nCRN: ${customer.crn}` };
    if (navigator.share) { try { await navigator.share(shareData); } catch {} }
    else { navigator.clipboard.writeText(shareData.text || ""); toast.success("Card details copied to clipboard"); }
  };

  const handleAddToWallet = (walletType: string) => { toast.info(`${walletType} integration coming soon! We're working on it.`); };

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

  // Get merchant-specific points for the selected merchant
  const selectedMerchant = selectedMerchantId ? customerMerchants.find(cm => cm.merchant_id === selectedMerchantId) : null;
  const displayPoints = selectedMerchant ? selectedMerchant.points_balance : customer.points_balance;

  // Filter data by selected merchant
  const filteredRewards = selectedMerchantId ? rewards.filter(r => r.merchant_id === selectedMerchantId) : rewards;
  const filteredCampaigns = selectedMerchantId ? campaigns.filter(c => c.merchant_id === selectedMerchantId) : campaigns;
  const filteredOffers = selectedMerchantId ? monthlyOffers.filter(o => o.merchant_id === selectedMerchantId) : monthlyOffers;
  const filteredTransactions = selectedMerchantId ? transactions.filter(t => t.merchant_id === selectedMerchantId) : transactions;
  const filteredRedemptions = selectedMerchantId ? redemptions.filter(r => r.merchant_id === selectedMerchantId) : redemptions;

  const issuedDate = customer.card_issued_at ? new Date(customer.card_issued_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const carouselSlides = [
    ...filteredCampaigns.map(c => ({ type: "campaign" as const, title: c.title, description: c.description, store: c.store_name, endsIn: null })),
    ...filteredOffers.map(o => ({ type: "offer" as const, title: o.title, description: o.description, store: o.store_name, endsIn: o.valid_to ? daysUntil(o.valid_to) : null })),
  ];
  const nearestReward = filteredRewards.length > 0
    ? filteredRewards.reduce((closest, r) => {
        const diff = r.points_required - displayPoints;
        const closestDiff = closest.points_required - displayPoints;
        if (diff > 0 && (closestDiff <= 0 || diff < closestDiff)) return r;
        return closest;
      }, filteredRewards[0])
    : null;
  const nearestProgress = nearestReward ? Math.min((displayPoints / nearestReward.points_required) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
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

        {/* ─── Main Tab Switcher ─── */}
        <div className="flex gap-1 bg-card rounded-xl p-1 border border-border/50 shadow-card">
          <button
            onClick={() => setActiveMainTab("my-rewards")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMainTab === "my-rewards"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🎁 My Rewards
          </button>
          <button
            onClick={() => setActiveMainTab("explore")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMainTab === "explore"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔍 Explore
          </button>
        </div>

        {activeMainTab === "explore" ? (
          <ExploreTab customerMerchantIds={customerMerchants.map(cm => cm.merchant_id)} />
        ) : (
        <>
        {/* ─── My Stores Section ─── */}
        {customerMerchants.length > 0 && (
          <ScrollReveal delay={15}>
            <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Store size={16} className="text-secondary" /> My Stores
                </h3>
                {selectedMerchantId && (
                  <button onClick={() => setSelectedMerchantId(null)} className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                    <ArrowLeft size={12} /> All Stores
                  </button>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                {customerMerchants.map(cm => {
                  const isSelected = selectedMerchantId === cm.merchant_id;
                  return (
                    <button
                      key={cm.merchant_id}
                      onClick={() => setSelectedMerchantId(isSelected ? null : cm.merchant_id)}
                      className={`min-w-[160px] snap-start flex-shrink-0 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-[0_0_15px_-4px_hsl(var(--primary)/0.3)]'
                          : 'border-border/30 bg-muted/20 hover:shadow-card'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center overflow-hidden">
                          {cm.logo_url ? (
                            <img src={cm.logo_url} alt={cm.store_name} className="w-full h-full object-cover" />
                          ) : (
                            <Store size={14} className="text-secondary" />
                          )}
                        </div>
                        <p className="font-semibold text-xs text-foreground truncate flex-1">{cm.store_name}</p>
                      </div>
                      <p className="text-lg font-bold text-primary tabular-nums">{cm.points_balance} <span className="text-[10px] font-normal text-muted-foreground">pts</span></p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>{cm.visit_count} visits</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>${cm.total_spend.toFixed(0)} spent</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ─── Points Balance ─── */}
        <ScrollReveal delay={25}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mb-3">
              {selectedMerchant ? `${selectedMerchant.store_name} Points` : "Total Points Balance"}
            </p>
            <div className={`flex items-center justify-center gap-3 transition-all duration-700 ${pointsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Star className="text-accent fill-accent" size={22} />
              </div>
              <span className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums">{displayPoints}</span>
            </div>
            {selectedMerchantId && !selectedMerchant && (
              <p className="text-xs text-muted-foreground mt-2">No points at this store yet. Make a purchase to start earning!</p>
            )}
            {nearestReward && nearestReward.points_required > displayPoints ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Next: <span className="font-semibold text-foreground">{nearestReward.title}</span></span>
                  <span>{nearestReward.points_required - displayPoints} pts to go</span>
                </div>
                <Progress value={nearestProgress} className="h-2" />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs mt-3">Keep earning to unlock exclusive rewards!</p>
            )}
            <button onClick={() => setShowClaimInfo(true)} className="mt-3 text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 mx-auto transition-colors">
              <Info size={10} /> How to earn points
            </button>
          </div>
        </ScrollReveal>

        {/* ─── Loyalty Card ─── */}
        <ScrollReveal delay={50}>
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
        <ScrollReveal delay={75}>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-9 border-border/50" onClick={() => handleCopy("Card Number", customer.loyalty_card_number || "")}>
              <Copy size={13} /> Copy
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-9 border-border/50" onClick={handleShare}>
              <Share2 size={13} /> Share
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs h-9 border-border/50 px-3" onClick={() => handleAddToWallet("Apple Wallet")} title="Apple Wallet">
              🍎
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs h-9 border-border/50 px-3" onClick={() => handleAddToWallet("Google Wallet")} title="Google Wallet">
              📱
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs h-9 border-border/50 px-3" onClick={() => handleAddToWallet("Samsung Pay")} title="Samsung Pay">
              💳
            </Button>
          </div>
        </ScrollReveal>

        {/* ─── Promo Banner Carousel ─── */}
        {carouselSlides.length > 0 && (
          <ScrollReveal delay={100}>
            <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {carouselSlides.map((slide, i) => (
                  <CarouselItem key={`${slide.type}-${i}`}>
                    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${CAROUSEL_GRADIENTS[i % CAROUSEL_GRADIENTS.length]} p-5 sm:p-6 min-h-[140px] flex flex-col justify-between`}>
                      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-primary-foreground/10" />
                      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border border-primary-foreground/8" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          {slide.type === "campaign" ? <Megaphone size={14} className="text-primary-foreground/70" /> : <CalendarDays size={14} className="text-primary-foreground/70" />}
                          <span className="text-primary-foreground/60 text-[10px] uppercase tracking-wider">{slide.store}</span>
                        </div>
                        <h3 className="text-primary-foreground font-bold text-base sm:text-lg leading-tight">{slide.title}</h3>
                        {slide.description && <p className="text-primary-foreground/70 text-xs mt-1 line-clamp-2">{slide.description}</p>}
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
              {slideCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button key={i} onClick={() => carouselApi?.scrollTo(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-primary w-5' : 'bg-border'}`} />
                  ))}
                </div>
              )}
            </Carousel>
          </ScrollReveal>
        )}

        {/* ─── Available Rewards ─── */}
        <ScrollReveal delay={125}>
          <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Gift size={16} className="text-accent" /> Available Rewards
              {selectedMerchant && <span className="text-xs font-normal text-muted-foreground">at {selectedMerchant.store_name}</span>}
            </h3>
            {filteredRewards.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3"><Gift size={22} className="text-muted-foreground/40" /></div>
                <p className="text-sm text-muted-foreground">No rewards available yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Shop at partner stores to unlock rewards.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                {filteredRewards.map((r) => {
                  // Use per-merchant points if viewing a specific merchant, else global
                  const merchantCm = customerMerchants.find(cm => cm.merchant_id === r.merchant_id);
                  const pointsForThisMerchant = merchantCm ? merchantCm.points_balance : 0;
                  const progress = Math.min((pointsForThisMerchant / r.points_required) * 100, 100);
                  const readyToRedeem = progress >= 100;
                  const almostThere = progress >= 80 && progress < 100;
                  const IconComp = rewardTypeIcon(r.reward_type);
                  return (
                    <div key={r.id} onClick={() => setSelectedReward(r)}
                      className={`min-w-[200px] sm:min-w-[220px] snap-start flex-shrink-0 rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card cursor-pointer ${
                        readyToRedeem ? 'border-accent/50 bg-accent/5 shadow-[0_0_20px_-4px_hsl(var(--accent)/0.3)]' : 'border-border/30 bg-muted/20'
                      }`}
                    >
                      {r.image_url && (
                        <img src={r.image_url} alt={r.title} className="w-full h-24 object-cover" />
                      )}
                      <div className="p-4">
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
                        <span>{pointsForThisMerchant}/{r.points_required} pts</span>
                        {readyToRedeem && <span className="text-accent-foreground font-bold animate-pulse">Ready to redeem!</span>}
                        {almostThere && <span className="text-secondary font-semibold">Almost there!</span>}
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      {r.is_limited_time && r.expires_at && (
                        <p className="text-[9px] text-muted-foreground/60 mt-2 flex items-center gap-0.5"><Clock size={8} /> Expires {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Monthly Offers ─── */}
        {filteredOffers.length > 0 && (
          <ScrollReveal delay={150}>
            <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <CalendarDays size={16} className="text-accent" /> Monthly Offers
              </h3>
              <div className="space-y-3">
                {filteredOffers.map((o) => (
                  <div key={o.id} className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/30 hover:-translate-y-0.5 hover:shadow-card transition-all duration-200">
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
            </div>
          </ScrollReveal>
        )}

        {/* ─── Points Earned ─── */}
        <ScrollReveal delay={175}>
          <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
            <button onClick={() => setShowTransactions(!showTransactions)} className="w-full flex items-center justify-between p-5 sm:p-6 text-left">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shield size={16} className="text-secondary" /> Points Earned
                <span className="text-xs font-normal text-muted-foreground">({filteredTransactions.length})</span>
              </h3>
              <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${showTransactions ? 'rotate-90' : ''}`} />
            </button>
            {showTransactions && (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-6">
                    <Gift size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{tx.merchant_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">${tx.purchase_amount.toFixed(2)}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={10} /> {new Date(tx.transaction_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-accent-foreground bg-accent/15 px-2 py-1 rounded-lg">+{tx.points_awarded}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Redemption History ─── */}
        {filteredRedemptions.length > 0 && (
          <ScrollReveal delay={200}>
            <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/50">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Ticket size={16} className="text-secondary" /> My Redemptions
              </h3>
              <div className="space-y-2">
                {filteredRedemptions.map((r) => {
                  const isExpired = r.status === 'expired' || (r.status === 'pending' && new Date(r.expires_at) < new Date());
                  const isVerified = r.status === 'verified';
                  const isPending = r.status === 'pending' && !isExpired;
                  return (
                    <div key={r.id} className={`p-3 rounded-xl border ${isPending ? 'border-accent/30 bg-accent/5' : 'border-border/30 bg-muted/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground">{r.reward_title}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{r.store_name}</p>
                        </div>
                        <div className="pl-2">
                          {isVerified && <span className="text-[10px] bg-green-500/15 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Used</span>}
                          {isPending && <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Pending</span>}
                          {isExpired && <span className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle size={10} /> Expired</span>}
                        </div>
                      </div>
                      {isPending && (
                        <div className="mt-2 bg-card rounded-lg p-2 border border-border/30 text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">Show this code to merchant</p>
                          <p className="font-mono text-lg font-bold text-foreground tracking-[0.3em]">{r.redemption_code}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1">Expires {new Date(r.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span>{r.points_spent} pts</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>{new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ─── Write a Review ─── */}
        <ScrollReveal delay={225}>
          <WriteReviewSection customerName={customer?.full_name || ""} />
        </ScrollReveal>

        {/* ─── Admin Panel ─── */}
        {isAdmin && (
          <ScrollReveal>
            <Link to="/admin" className="block">
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-5 sm:p-6 border border-accent/20 flex items-center justify-between hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center"><Shield size={20} className="text-accent" /></div>
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
        </>
        )}
      </div>

      {/* ─── Reward Detail / Redeem Dialog ─── */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-sm">
          {selectedReward && (() => {
            const merchantCm = customerMerchants.find(cm => cm.merchant_id === selectedReward.merchant_id);
            const pointsForThisMerchant = merchantCm ? merchantCm.points_balance : 0;
            const progress = Math.min((pointsForThisMerchant / selectedReward.points_required) * 100, 100);
            const readyToRedeem = progress >= 100;
            const IconComp = rewardTypeIcon(selectedReward.reward_type);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <IconComp size={18} className="text-accent" /> {selectedReward.title}
                  </DialogTitle>
                  <DialogDescription>{selectedReward.store_name} · {selectedReward.reward_type}</DialogDescription>
                </DialogHeader>
                {selectedReward.description && <p className="text-sm text-muted-foreground">{selectedReward.description}</p>}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your points at {selectedReward.store_name}</span>
                    <span className="font-bold text-foreground">{pointsForThisMerchant}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Required</span>
                    <span className="font-bold text-foreground">{selectedReward.points_required}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {!readyToRedeem && (
                    <p className="text-xs text-muted-foreground text-center">You need {selectedReward.points_required - pointsForThisMerchant} more points at {selectedReward.store_name}</p>
                  )}
                </div>
                {readyToRedeem && (
                  <Button variant="hero" className="w-full gap-2" disabled={redeeming === selectedReward.id} onClick={() => handleRedeem(selectedReward.id)}>
                    <Ticket size={16} /> {redeeming === selectedReward.id ? "Redeeming..." : "Redeem Now"}
                  </Button>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Ways to Claim Points Popup ─── */}
      <Dialog open={showClaimInfo} onOpenChange={setShowClaimInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift size={18} className="text-secondary" /> Ways to Earn Points</DialogTitle>
            <DialogDescription>Here's how you can earn points at partner stores</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { icon: ScanBarcode, text: "Show your loyalty barcode or number at checkout" },
              { icon: Smartphone, text: "Merchant scans or enters your number" },
              { icon: Star, text: "Points are added instantly" },
              { icon: Gift, text: "Track your rewards anytime in Perk Back" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <item.icon size={14} className="text-secondary" />
                </div>
                <span className="text-sm text-foreground/80">{item.text}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Redemption Success Modal ─── */}
      {showRedemptionModal && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setShowRedemptionModal(null)}>
          <div className="bg-card rounded-2xl p-6 shadow-card-hover w-full max-w-sm animate-fade-up text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-accent" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Reward Redeemed! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-4">{showRedemptionModal.title}</p>
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Your Redemption Code</p>
              <p className="font-mono text-3xl font-bold text-foreground tracking-[0.3em]">{showRedemptionModal.code}</p>
              <p className="text-xs text-muted-foreground mt-2">Show this code to the merchant</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span>{showRedemptionModal.points} pts spent</span>
              <span>Valid for 48 hours</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { navigator.clipboard.writeText(showRedemptionModal.code); toast.success("Code copied!"); }}>
                <Copy size={14} /> Copy Code
              </Button>
              <Button variant="hero" size="sm" className="flex-1" onClick={() => setShowRedemptionModal(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessCard;
